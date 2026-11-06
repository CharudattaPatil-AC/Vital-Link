const User = require('../models/User');

// GET /api/donors - Find matching donors
exports.getDonors = async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius } = req.query;

    let query = { role: 'donor', isAvailable: true };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    if (lat && lng) {
      const maxDistance = parseInt(radius) || 5000;
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

    const donors = await User.find(query).select('-password');
    res.json(donors);
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ message: 'Server error fetching donors' });
  }
};

// PUT /api/donors/availability - Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();

    res.json({ isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/donors/location - Update donor location
exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid coordinates [lng, lat] are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: coordinates
        }
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
