const Reservation = require('../models/Reservation');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

// POST /api/reservations - Create reservation with atomic operation
exports.createReservation = async (req, res) => {
  try {
    const { facilityId, facilityType, resourceType, bloodGroup, quantity, notes } = req.body;
    const qty = quantity || 1;

    let facility;
    let facilityName;

    if (facilityType === 'hospital') {
      // Atomic update: decrement available count only if enough available
      const resourcePath = {
        icuBed: 'resources.icuBeds.available',
        generalBed: 'resources.generalBeds.available',
        oxygenCylinder: 'resources.oxygenCylinders.available',
        ventilator: 'resources.ventilators.available'
      };

      const field = resourcePath[resourceType];
      if (!field) {
        return res.status(400).json({ message: 'Invalid resource type for hospital' });
      }

      facility = await Hospital.findOneAndUpdate(
        { _id: facilityId, [field]: { $gte: qty } },
        { $inc: { [field]: -qty } },
        { new: true }
      );

      if (!facility) {
        return res.status(400).json({ message: 'Resource not available or insufficient quantity' });
      }
      facilityName = facility.name;

    } else if (facilityType === 'bloodbank') {
      if (!bloodGroup) {
        return res.status(400).json({ message: 'Blood group is required for blood bank reservation' });
      }

      facility = await BloodBank.findOneAndUpdate(
        {
          _id: facilityId,
          'inventory': {
            $elemMatch: {
              bloodGroup: bloodGroup,
              unitsAvailable: { $gte: qty }
            }
          }
        },
        { $inc: { 'inventory.$.unitsAvailable': -qty } },
        { new: true }
      );

      if (!facility) {
        return res.status(400).json({ message: 'Blood units not available or insufficient quantity' });
      }
      facilityName = facility.name;
    } else {
      return res.status(400).json({ message: 'Invalid facility type' });
    }

    const reservation = await Reservation.create({
      patient: req.user._id,
      facilityId,
      facilityType,
      facilityName,
      resourceType,
      bloodGroup,
      quantity: qty,
      notes,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('reservationCreated', {
        reservation,
        facilityId,
        facilityType
      });
      io.emit('inventoryUpdate', {
        type: facilityType,
        facilityId,
        facility
      });
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Server error creating reservation' });
  }
};

// GET /api/reservations - Get reservations
exports.getReservations = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient' || req.user.role === 'donor') {
      query.patient = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ managedBy: req.user._id });
      if (hospital) {
        query.facilityId = hospital._id;
        query.facilityType = 'hospital';
      }
    } else if (req.user.role === 'bloodbank') {
      const bloodBank = await BloodBank.findOne({ managedBy: req.user._id });
      if (bloodBank) {
        query.facilityId = bloodBank._id;
        query.facilityType = 'bloodbank';
      }
    }

    const reservations = await Reservation.find(query)
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching reservations' });
  }
};

// PUT /api/reservations/:id/status - Update reservation status
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // If cancelling, return the resource
    if (status === 'cancelled' && reservation.status === 'pending') {
      if (reservation.facilityType === 'hospital') {
        const resourcePath = {
          icuBed: 'resources.icuBeds.available',
          generalBed: 'resources.generalBeds.available',
          oxygenCylinder: 'resources.oxygenCylinders.available',
          ventilator: 'resources.ventilators.available'
        };
        const field = resourcePath[reservation.resourceType];
        if (field) {
          await Hospital.findByIdAndUpdate(reservation.facilityId, {
            $inc: { [field]: reservation.quantity }
          });
        }
      } else if (reservation.facilityType === 'bloodbank') {
        await BloodBank.findOneAndUpdate(
          {
            _id: reservation.facilityId,
            'inventory.bloodGroup': reservation.bloodGroup
          },
          { $inc: { 'inventory.$.unitsAvailable': reservation.quantity } }
        );
      }
    }

    reservation.status = status;
    await reservation.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('reservationUpdate', { reservation });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({ message: 'Server error updating reservation' });
  }
};

// Automated Expiration Cleanup: Check & restock expired pending holds
exports.checkExpiredReservations = async (io) => {
  try {
    const now = new Date();
    const expiredList = await Reservation.find({
      status: 'pending',
      expiresAt: { $lt: now }
    });

    for (const res of expiredList) {
      res.status = 'expired';
      await res.save();

      // Return held inventory
      if (res.facilityType === 'hospital') {
        const resourcePath = {
          icuBed: 'resources.icuBeds.available',
          generalBed: 'resources.generalBeds.available',
          oxygenCylinder: 'resources.oxygenCylinders.available',
          ventilator: 'resources.ventilators.available'
        };
        const field = resourcePath[res.resourceType];
        if (field) {
          const updated = await Hospital.findByIdAndUpdate(
            res.facilityId,
            { $inc: { [field]: res.quantity } },
            { new: true }
          );
          if (io && updated) {
            io.emit('inventoryUpdate', {
              type: 'hospital',
              facilityId: updated._id,
              resources: updated.resources
            });
          }
        }
      } else if (res.facilityType === 'bloodbank') {
        const updated = await BloodBank.findOneAndUpdate(
          {
            _id: res.facilityId,
            'inventory.bloodGroup': res.bloodGroup
          },
          { $inc: { 'inventory.$.unitsAvailable': res.quantity } },
          { new: true }
        );
        if (io && updated) {
          io.emit('inventoryUpdate', {
            type: 'bloodbank',
            facilityId: updated._id,
            inventory: updated.inventory
          });
        }
      }

      if (io) {
        io.emit('reservationUpdate', { reservation: res });
      }
    }

    if (expiredList.length > 0) {
      console.log(`Auto-cleaned and restocked ${expiredList.length} expired reservations.`);
    }
  } catch (err) {
    console.error('Error running reservation expiry check:', err.message);
  }
};
