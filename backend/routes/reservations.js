const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservations,
  updateReservationStatus
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReservation);
router.get('/', protect, getReservations);
router.put('/:id/status', protect, updateReservationStatus);

module.exports = router;
