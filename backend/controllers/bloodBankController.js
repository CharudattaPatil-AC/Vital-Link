const BloodBank = require('../models/BloodBank');

// GET /api/bloodbanks - Search nearby blood banks
exports.getBloodBanks = async (req, res) => {
  try {
    const { lat, lng, radius, bloodGroup, search, limit } = req.query;

    let query = {};

    if (lat && lng) {
      const maxDistance = parseInt(radius, 10) || 25000;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistance
        }
      };
    }

    if (bloodGroup) {
      query['inventory'] = {
        $elemMatch: {
          bloodGroup: bloodGroup,
          unitsAvailable: { $gt: 0 }
        }
      };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const maxResults = parseInt(limit, 10) || 60;
    const bloodBanks = await BloodBank.find(query)
      .populate('managedBy', 'name email')
      .limit(maxResults);

    res.json(bloodBanks);
  } catch (error) {
    console.error('Get blood banks error:', error);
    res.status(500).json({ message: 'Server error fetching blood banks' });
  }
};

// GET /api/bloodbanks/:id
exports.getBloodBankById = async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id).populate('managedBy', 'name email phone');
    if (!bloodBank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }
    res.json(bloodBank);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/bloodbanks - Create blood bank
exports.createBloodBank = async (req, res) => {
  try {
    const { name, email, phone, address, location } = req.body;

    const existing = await BloodBank.findOne({ managedBy: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already manage a blood bank' });
    }

    const defaultInventory = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({
      bloodGroup: bg,
      unitsAvailable: 0
    }));

    const bloodBank = await BloodBank.create({
      name,
      email,
      phone,
      address,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      },
      managedBy: req.user._id,
      inventory: defaultInventory
    });

    res.status(201).json(bloodBank);
  } catch (error) {
    console.error('Create blood bank error:', error);
    res.status(500).json({ message: 'Server error creating blood bank' });
  }
};

// PUT /api/bloodbanks/:id/inventory - Update blood inventory
exports.updateInventory = async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    if (bloodBank.managedBy && bloodBank.managedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'bloodbank') {
      return res.status(403).json({ message: 'Not authorized to update this blood bank' });
    }

    const { inventory } = req.body;
    if (inventory) {
      bloodBank.inventory = inventory;
    }

    await bloodBank.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('inventoryUpdate', {
        type: 'bloodbank',
        facilityId: bloodBank._id,
        inventory: bloodBank.inventory
      });
    }

    res.json(bloodBank);
  } catch (error) {
    console.error('Update blood bank inventory error:', error);
    res.status(500).json({ message: 'Server error updating inventory' });
  }
};

// GET /api/bloodbanks/my - Get blood bank managed by current user
exports.getMyBloodBank = async (req, res) => {
  try {
    let bloodBank = await BloodBank.findOne({ managedBy: req.user._id });
    if (!bloodBank && (req.user.role === 'bloodbank' || req.user.role === 'admin')) {
      // Automatically assign the flagship city blood bank to this admin so dashboard is ready
      bloodBank = (await BloodBank.findOne({ name: { $regex: 'Red Cross|Central|City', $options: 'i' } })) || (await BloodBank.findOne({}));
      if (bloodBank) {
        bloodBank.managedBy = req.user._id;
        await bloodBank.save();
      }
    }
    if (!bloodBank) {
      return res.status(404).json({ message: 'No blood bank found for this user' });
    }
    res.json(bloodBank);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/bloodbanks/:id/verify - Toggle verification (admin only)
exports.toggleVerifyBloodBank = async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }
    bloodBank.verified = !bloodBank.verified;
    await bloodBank.save();
    res.json(bloodBank);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
