const BloodRequest = require('../models/BloodRequest');
const BloodBank = require('../models/BloodBank');

// POST /api/blood-requests - Create emergency blood request with Exact Blood Group Matching
exports.createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsNeeded, urgency, location, radius, contactPhone, hospitalName } = req.body;

    const compatibleGroups = [bloodGroup];
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

    // Query nearby verified blood banks holding the exact blood group requested
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
          bloodGroup: bloodGroup,
          unitsAvailable: { $gt: 0 }
        }
      }
    }).select('name phone address inventory location');

    // Map matched blood banks with distance and available units of requested blood group
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

      const exactMatch = bank.inventory.find(i => i.bloodGroup === bloodGroup && i.unitsAvailable > 0);
      const units = exactMatch ? exactMatch.unitsAvailable : 0;

      return {
        bloodBank: bank._id,
        name: bank.name,
        address: bank.address,
        phone: bank.phone,
        distanceKm,
        unitsAvailable: units,
        bloodGroup: bloodGroup,
        matchTier: 1,
        matchLabel: `Exact Match (${bloodGroup})`
      };
    });

    // Sort by proximity distance
    matchedBloodBanks.sort((a, b) => a.distanceKm - b.distanceKm);

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
