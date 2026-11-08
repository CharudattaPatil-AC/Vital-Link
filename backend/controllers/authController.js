const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, bloodGroup, dateOfBirth, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'patient',
      bloodGroup
    };

    if (location && location.coordinates) {
      userData.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    const user = await User.create(userData);

    // If new user is a Hospital or Blood Bank manager, create their facility record linked to their ID
    const facilityLocation = (location && location.coordinates && location.coordinates.length === 2 && (location.coordinates[0] !== 0 || location.coordinates[1] !== 0))
      ? { type: 'Point', coordinates: location.coordinates }
      : { type: 'Point', coordinates: [77.2090, 28.6139] };

    if (user.role === 'bloodbank') {
      const defaultInventory = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({
        bloodGroup: bg,
        unitsAvailable: 10
      }));
      await BloodBank.create({
        name: `${user.name} Blood Center`,
        email: user.email,
        phone: user.phone,
        address: 'Facility Wing, Main Road',
        location: facilityLocation,
        managedBy: user._id,
        verified: true,
        inventory: defaultInventory
      });
    } else if (user.role === 'hospital') {
      await Hospital.create({
        name: `${user.name} Emergency Hospital`,
        email: user.email,
        phone: user.phone,
        address: 'Hospital Emergency Wing, Main Road',
        location: facilityLocation,
        managedBy: user._id,
        verified: true,
        operatingHours: '24/7',
        resources: {
          icuBeds: { total: 20, available: 5 },
          generalBeds: { total: 100, available: 25 },
          oxygenCylinders: { total: 50, available: 15 },
          ventilators: { total: 10, available: 3 }
        }
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
