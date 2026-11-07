const Reservation = require('../models/Reservation');
const Hospital = require('../models/Hospital');

// POST /api/reservations - Create reservation with atomic operation
exports.createReservation = async (req, res) => {
  try {
    const { facilityId, facilityType, resourceType, quantity, notes } = req.body;
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

    } else {
      return res.status(400).json({ message: 'Reservations are only applicable for hospital emergency beds and resources' });
    }

    const reservation = await Reservation.create({
      patient: req.user._id,
      facilityId,
      facilityType: 'hospital',
      facilityName,
      resourceType,
      quantity: qty,
      notes,
      status: 'pending'
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
        type: 'hospital',
        facilityId,
        resources: facility.resources
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

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ managedBy: req.user._id });
      if (hospital) {
        query.facilityId = hospital._id;
        query.facilityType = 'hospital';
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

// PUT /api/reservations/:id/status - Update reservation status (confirmed/cancelled/completed)
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const previousStatus = reservation.status;
    const io = req.app.get('io');

    // Restock bed if:
    // 1. Pending reservation is cancelled or rejected
    // 2. Confirmed patient is discharged / marked completed
    const shouldRestock =
      (status === 'cancelled' && previousStatus === 'pending') ||
      (status === 'completed' && previousStatus === 'confirmed');

    if (shouldRestock && reservation.facilityType === 'hospital') {
      const resourcePath = {
        icuBed: 'resources.icuBeds.available',
        generalBed: 'resources.generalBeds.available',
        oxygenCylinder: 'resources.oxygenCylinders.available',
        ventilator: 'resources.ventilators.available'
      };
      const field = resourcePath[reservation.resourceType];
      if (field) {
        const updatedHospital = await Hospital.findByIdAndUpdate(
          reservation.facilityId,
          { $inc: { [field]: reservation.quantity } },
          { new: true }
        );
        if (io && updatedHospital) {
          io.emit('inventoryUpdate', {
            type: 'hospital',
            facilityId: updatedHospital._id,
            resources: updatedHospital.resources
          });
        }
      }
    }

    reservation.status = status;
    await reservation.save();

    if (io) {
      io.emit('reservationUpdate', { reservation });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({ message: 'Server error updating reservation' });
  }
};
