const Hospital = require('../models/Hospital');

// GET /api/hospitals - Search nearby or all-India hospitals
exports.getHospitals = async (req, res) => {
  try {
    const { lat, lng, radius, resource, search, state, limit } = req.query;

    let query = {};

    // Only apply geospatial $near if both lat and lng are provided
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      const maxDistance = parseInt(radius, 10) || 50000;
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

    if (state && state !== 'All India' && state !== 'All States') {
      query.address = { $regex: state.trim(), $options: 'i' };
    }

    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { address: searchRegex }
      ];
    }

    if (resource) {
      const resourceMap = {
        icuBeds: 'resources.icuBeds.available',
        generalBeds: 'resources.generalBeds.available',
        oxygenCylinders: 'resources.oxygenCylinders.available',
        ventilators: 'resources.ventilators.available'
      };
      if (resourceMap[resource]) {
        query[resourceMap[resource]] = { $gt: 0 };
      }
    }

    const maxResults = parseInt(limit, 10) || 120;
    const hospitals = await Hospital.find(query)
      .populate('managedBy', 'name email')
      .limit(maxResults);
    res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ message: 'Server error fetching hospitals' });
  }
};

// GET /api/hospitals/:id
exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).populate('managedBy', 'name email phone');
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/hospitals - Create hospital
exports.createHospital = async (req, res) => {
  try {
    const { name, email, phone, address, location, resources, operatingHours } = req.body;

    const existing = await Hospital.findOne({ managedBy: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already manage a hospital' });
    }

    const hospital = await Hospital.create({
      name,
      email,
      phone,
      address,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      },
      managedBy: req.user._id,
      resources: resources || {},
      operatingHours: operatingHours || '24/7'
    });

    res.status(201).json(hospital);
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ message: 'Server error creating hospital' });
  }
};

// PUT /api/hospitals/:id/inventory - Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    if (hospital.managedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this hospital' });
    }

    const { resources } = req.body;

    if (resources) hospital.resources = resources;

    await hospital.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('inventoryUpdate', {
        type: 'hospital',
        facilityId: hospital._id,
        resources: hospital.resources
      });
    }

    res.json(hospital);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error updating inventory' });
  }
};

// GET /api/hospitals/my - Get hospital managed by current user
exports.getMyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ managedBy: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'No hospital found for this user' });
    }
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/hospitals/:id/verify - Toggle verification (admin only)
exports.toggleVerifyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    hospital.verified = !hospital.verified;
    await hospital.save();
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
