const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const {
  COMPATIBILITY_MATRIX,
  getTierForDonor,
  checkDonorEligibility
} = require('../utils/bloodCompatibility');

// POST /api/blood-requests - Create emergency blood request with Smart Compatibility Engine
exports.createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsNeeded, urgency, location, radius, contactPhone, hospitalName } = req.body;

    // 1. Determine compatible blood groups using transfusion matrix
    const compatibleGroups = COMPATIBILITY_MATRIX[bloodGroup] || [bloodGroup];
    const searchRadius = parseInt(radius, 10) || 5000;

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

    // 2. Query nearby potential donors with any compatible blood group
    const candidateDonors = await User.find({
      role: 'donor',
      isAvailable: true,
      bloodGroup: { $in: compatibleGroups },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: searchRadius
        }
      }
    }).select('-password');

    // 3. Filter by Medical Safety (90-day cooldown, 18-65 age limit) and assign priority tiers
    const eligibleDonors = [];
    for (const donor of candidateDonors) {
      const eligibility = checkDonorEligibility(donor);
      if (eligibility.eligible) {
        const { tier, label } = getTierForDonor(bloodGroup, donor.bloodGroup);
        eligibleDonors.push({
          donor,
          tier,
          label
        });
      }
    }

    // Sort by Tier (Tier 1 exact match first, then Tier 2, Tier 3, Tier 4)
    eligibleDonors.sort((a, b) => a.tier - b.tier);

    // Rare Blood Protection Logic:
    // If urgency is NOT 'critical' and we already have Tier 1-3 donors, reserve O- donors for true O- patients
    let finalMatchedDonors = eligibleDonors;
    if (urgency !== 'critical') {
      const nonTier4 = eligibleDonors.filter(d => d.tier < 4);
      if (nonTier4.length > 0) {
        finalMatchedDonors = nonTier4;
      }
    }

    // Attach to blood request
    bloodRequest.matchedDonors = finalMatchedDonors.map(item => ({
      donor: item.donor._id,
      donorBloodGroup: item.donor.bloodGroup,
      matchTier: item.tier,
      matchLabel: item.label,
      status: 'pending'
    }));
    await bloodRequest.save();

    // 4. Cross-Inventory Blood Bank Check:
    // Check if nearby certified blood banks already have compatible units in stock
    const nearbyBloodBanks = await BloodBank.find({
      verified: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: Math.max(searchRadius, 10000) // check up to 10km for banks
        }
      },
      'inventory': {
        $elemMatch: {
          bloodGroup: { $in: compatibleGroups },
          unitsAvailable: { $gt: 0 }
        }
      }
    }).select('name phone address inventory location');

    const compatibleBankStock = nearbyBloodBanks.map(bank => {
      const matchingItems = bank.inventory.filter(
        item => compatibleGroups.includes(item.bloodGroup) && item.unitsAvailable > 0
      );
      return {
        bloodBankId: bank._id,
        name: bank.name,
        phone: bank.phone,
        address: bank.address,
        availableUnits: matchingItems
      };
    });

    // 5. Real-time Targeted Notifications via Socket.IO
    const io = req.app.get('io');
    if (io) {
      finalMatchedDonors.forEach(item => {
        io.to(`user_${item.donor._id}`).emit('bloodRequest', {
          requestId: bloodRequest._id,
          requestedBloodGroup: bloodGroup,
          donorBloodGroup: item.donor.bloodGroup,
          matchLabel: item.label,
          matchTier: item.tier,
          unitsNeeded,
          urgency,
          hospitalName,
          contactPhone
        });
      });
      io.emit('newBloodRequest', { bloodRequest });
    }

    res.status(201).json({
      bloodRequest,
      compatibleGroups,
      matchedDonorsCount: finalMatchedDonors.length,
      tierBreakdown: {
        tier1Exact: finalMatchedDonors.filter(d => d.tier === 1).length,
        tier2Compatible: finalMatchedDonors.filter(d => d.tier === 2).length,
        tier3UniversalPos: finalMatchedDonors.filter(d => d.tier === 3).length,
        tier4UniversalReserve: finalMatchedDonors.filter(d => d.tier === 4).length
      },
      compatibleBankStock
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

    if (req.user.role === 'donor') {
      query['matchedDonors.donor'] = req.user._id;
    } else if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }
    // Admin can see all

    const requests = await BloodRequest.find(query)
      .populate('patient', 'name email phone')
      .populate('matchedDonors.donor', 'name phone bloodGroup')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching blood requests' });
  }
};

// PUT /api/blood-requests/:id/respond - Donor responds
exports.respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const requestId = req.params.id;
    const donorId = req.user._id;

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    const donorEntry = bloodRequest.matchedDonors.find(
      d => d.donor.toString() === donorId.toString()
    );

    if (!donorEntry) {
      return res.status(403).json({ message: 'You are not matched to this request' });
    }

    donorEntry.status = status;
    donorEntry.respondedAt = new Date();
    await bloodRequest.save();

    // If accepted, update donor's lastDonationDate to now
    if (status === 'accepted') {
      await User.findByIdAndUpdate(donorId, { lastDonationDate: new Date() });
    }

    // Notify the patient
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${bloodRequest.patient}`).emit('donorResponse', {
        requestId: bloodRequest._id,
        donorId,
        donorName: req.user.name,
        donorPhone: req.user.phone,
        status
      });
    }

    res.json({ message: `Request ${status}`, bloodRequest });
  } catch (error) {
    console.error('Respond to blood request error:', error);
    res.status(500).json({ message: 'Server error' });
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
