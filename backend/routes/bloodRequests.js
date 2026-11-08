const express = require('express');
const router = express.Router();
const {
  createBloodRequest,
  getBloodRequests,
  getActiveRequests,
  updateStatus
} = require('../controllers/bloodRequestController');
const { protect } = require('../middleware/auth');

router.get('/active', getActiveRequests);
router.post('/', protect, createBloodRequest);
router.get('/', protect, getBloodRequests);
router.put('/:id/status', protect, updateStatus);

module.exports = router;
