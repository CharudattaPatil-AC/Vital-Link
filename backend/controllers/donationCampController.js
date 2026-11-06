const DonationCamp = require('../models/DonationCamp');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

// @desc    Get all donation camps with filters
// @route   GET /api/camps
// @access  Public
exports.getDonationCamps = async (req, res) => {
  try {
    const { state, city, status, search } = req.query;
    const query = {};

    if (state) query.state = new RegExp(`^${state.trim()}$`, 'i');
    if (city) query.city = new RegExp(city.trim(), 'i');
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { venue: new RegExp(search.trim(), 'i') },
        { organizerName: new RegExp(search.trim(), 'i') }
      ];
    }

    const camps = await DonationCamp.find(query)
      .sort({ startDate: 1 })
      .populate('organizer', 'name email phone');

    res.json(camps);
  } catch (err) {
    console.error('Error fetching donation camps:', err);
    res.status(500).json({ message: 'Server error retrieving donation camps' });
  }
};

// @desc    Get single camp by ID
// @route   GET /api/camps/:id
// @access  Public
exports.getDonationCampById = async (req, res) => {
  try {
    const camp = await DonationCamp.findById(req.params.id)
      .populate('organizer', 'name email phone')
      .populate('registeredDonors.donor', 'name email phone bloodGroup');

    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    res.json(camp);
  } catch (err) {
    console.error('Error fetching camp details:', err);
    res.status(500).json({ message: 'Server error retrieving camp details' });
  }
};

// @desc    Create a new donation camp
// @route   POST /api/camps
// @access  Private (hospital, bloodbank, admin)
exports.createDonationCamp = async (req, res) => {
  try {
    const {
      name,
      startDate,
      endDate,
      venue,
      city,
      state,
      contactPhone,
      targetUnits,
      latitude,
      longitude
    } = req.body;

    let organizerModel = 'BloodBank';
    let organizerName = req.user.name || 'Healthcare Facility';

    if (req.user.role === 'bloodbank') {
      organizerModel = 'BloodBank';
      const bb = await BloodBank.findOne({ managedBy: req.user._id });
      if (bb) organizerName = bb.name;
    } else if (req.user.role === 'hospital') {
      organizerModel = 'Hospital';
      const hosp = await Hospital.findOne({ managedBy: req.user._id });
      if (hosp) organizerName = hosp.name;
    }

    const coords = [
      longitude ? parseFloat(longitude) : 78.9629,
      latitude ? parseFloat(latitude) : 20.5937
    ];

    const camp = new DonationCamp({
      name,
      organizer: req.user._id,
      organizerModel,
      organizerName,
      startDate,
      endDate,
      venue,
      city,
      state,
      contactPhone,
      targetUnits: targetUnits ? parseInt(targetUnits, 10) : 100,
      location: {
        type: 'Point',
        coordinates: coords
      }
    });

    await camp.save();
    res.status(201).json(camp);
  } catch (err) {
    console.error('Error creating donation camp:', err);
    res.status(500).json({ message: 'Server error creating donation camp' });
  }
};

// @desc    RSVP / Register for a donation camp
// @route   POST /api/camps/:id/rsvp
// @access  Private (donor, patient, any authenticated user)
exports.rsvpDonationCamp = async (req, res) => {
  try {
    const camp = await DonationCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    const alreadyRegistered = camp.registeredDonors.some(
      (r) => r.donor && r.donor.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You are already registered for this camp' });
    }

    const registration = {
      donor: req.user._id,
      donorName: req.user.name,
      bloodGroup: req.user.bloodGroup || req.body.bloodGroup || 'O+',
      phone: req.user.phone || req.body.phone || 'N/A',
      email: req.user.email,
      registeredAt: new Date()
    };

    camp.registeredDonors.push(registration);
    await camp.save();

    res.json({ message: 'Successfully RSVPed for donation camp', camp });
  } catch (err) {
    console.error('Error RSVPing for camp:', err);
    res.status(500).json({ message: 'Server error RSVPing for camp' });
  }
};

// @desc    Mark donor attendance and issue donation certificate
// @route   PATCH /api/camps/:id/attendance
// @access  Private (organizer or admin)
exports.markAttendance = async (req, res) => {
  try {
    const { donorId, attended, unitsDonated } = req.body;
    const camp = await DonationCamp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    const regIndex = camp.registeredDonors.findIndex(
      (r) => r.donor && r.donor.toString() === donorId
    );

    if (regIndex === -1) {
      return res.status(404).json({ message: 'Donor registration not found in this camp' });
    }

    const reg = camp.registeredDonors[regIndex];
    reg.attended = attended !== undefined ? attended : true;
    if (unitsDonated) reg.unitsDonated = unitsDonated;

    if (reg.attended && !reg.certificateId) {
      reg.certificateId = `CERT-LL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    camp.collectedUnits = camp.registeredDonors
      .filter((r) => r.attended)
      .reduce((sum, r) => sum + (r.unitsDonated || 1), 0);

    await camp.save();
    res.json({ message: 'Attendance updated successfully', camp });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: 'Server error updating attendance' });
  }
};

// @desc    Update camp status
// @route   PATCH /api/camps/:id/status
// @access  Private (organizer or admin)
exports.updateCampStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const camp = await DonationCamp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    camp.status = status;
    await camp.save();

    res.json({ message: 'Camp status updated', camp });
  } catch (err) {
    console.error('Error updating camp status:', err);
    res.status(500).json({ message: 'Server error updating camp status' });
  }
};
