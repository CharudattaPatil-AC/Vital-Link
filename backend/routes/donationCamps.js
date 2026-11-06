const express = require('express');
const {
  getDonationCamps,
  getDonationCampById,
  createDonationCamp,
  rsvpDonationCamp,
  markAttendance,
  updateCampStatus
} = require('../controllers/donationCampController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.get('/', getDonationCamps);
router.get('/:id', getDonationCampById);

// Authenticated routes
router.post(
  '/',
  protect,
  authorize('hospital', 'bloodbank', 'admin'),
  createDonationCamp
);

router.post('/:id/rsvp', protect, rsvpDonationCamp);

router.patch(
  '/:id/attendance',
  protect,
  authorize('hospital', 'bloodbank', 'admin'),
  markAttendance
);

router.patch(
  '/:id/status',
  protect,
  authorize('hospital', 'bloodbank', 'admin'),
  updateCampStatus
);

module.exports = router;
