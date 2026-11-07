const BloodRequest = require('../models/BloodRequest');
const BloodBank = require('../models/BloodBank');
const { COMPATIBILITY_MATRIX } = require('../utils/bloodCompatibility');

// POST /api/blood-requests - Create emergency blood request with Smart Blood Bank Inventory Matching
exports.createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsNeeded, urgency, location, radius, contactPhone, hospitalName } = req.body;

    // 1. Determine compatible blood groups using transfusion matrix
    const compatibleGroups = COMPATIBILITY_MATRIX[bloodGroup] || [bloodGroup];
    const searchRadius = parseInt(radius, 10) || 25000;

    const bloodRequest = await BloodRequest.create({
      patient: req.user._id,
      bloodGroup,
      compatibleGroups,
      unitsNeeded,
      urgency: urgency || 'normal',
      location: {
        type: 'Point',
        coordinates: location.coordinates
      },
      radius: searchRadius,
      contactPhone,
      hospitalName,
      status: 'active'
    });

    // 2. Query nearby verified blood banks holding compatible units
    const nearbyBloodBanks = await BloodBank.find({
      verified: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: searchRadius
        }
      },
      'inventory': {
        $elemMatch: {
          bloodGroup: { $in: compatibleGroups },
          unitsAvailable: { $gt: 0 }
        }
      }
    }).select('name phone address inventory location');

    // 3. Map matched blood banks with distance, exact vs compatible tier, and units
    const [pLng, pLat] = location.coordinates;
    const matchedBloodBanks = nearbyBloodBanks.map(bank => {
      const [bankLng, bankLat] = bank.location.coordinates;
      const dLat = (bankLat - pLat) * (Math.PI / 180);
      const dLng = (bankLng - pLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pLat * (Math.PI / 180)) *
          Math.cos(bankLat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Math.round(6371 * c * 10) / 10;

      const matchingItems = bank.inventory.filter(
        item => compatibleGroups.includes(item.bloodGroup) && item.unitsAvailable > 0
      );
      const exactMatch = matchingItems.find(i => i.bloodGroup === bloodGroup);
      const primaryGroup = exactMatch ? exactMatch.bloodGroup : matchingItems[0]?.bloodGroup;
      const primaryUnits = exactMatch ? exactMatch.unitsAvailable : matchingItems[0]?.unitsAvailable;

      return {
        bloodBank: bank._id,
        name: bank.name,
        address: bank.address,
        phone: bank.phone,
        distanceKm,
        unitsAvailable: primaryUnits || 0,
        bloodGroup: primaryGroup || bloodGroup,
        matchTier: exactMatch ? 1 : 2,
        matchLabel: exactMatch ? `Exact Match (${bloodGroup})` : `Compatible Match (${primaryGroup})`,
        availableStock: matchingItems.map(m => ({
          bloodGroup: m.bloodGroup,
          unitsAvailable: m.unitsAvailable
        }))
      };
    });

    // Sort by Match Tier (Exact match first), then distance
    matchedBloodBanks.sort((a, b) => a.matchTier - b.matchTier || a.distanceKm - b.distanceKm);

    bloodRequest.matchedBloodBanks = matchedBloodBanks;
    await bloodRequest.save();

    // 4. Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('newBloodRequest', { bloodRequest });
    }

    res.status(201).json({
      bloodRequest,
      compatibleGroups,
      matchedBanksCount: matchedBloodBanks.length,
      matchedBloodBanks
    });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({ message: 'Server error creating blood request' });
  }
};

// GET /api/blood-requests - Get blood requests
exports.getBloodRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }

    const requests = await BloodRequest.find(query)
      .populate('patient', 'name email phone')
      .populate('matchedBloodBanks.bloodBank', 'name phone address')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching blood requests' });
  }
};

// GET /api/blood-requests/active - Get all active requests (public)
exports.getActiveRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ status: 'active' })
      .populate('patient', 'name phone')
      .sort({ urgency: 1, createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/blood-requests/:id/status - Update blood request status (fulfilled / cancelled)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (request.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    request.status = status;
    await request.save();

    res.json({ message: `Request status updated to ${status}`, request });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating status' });
  }
};
