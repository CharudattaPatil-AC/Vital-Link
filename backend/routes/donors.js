const express = require('express');
const router = express.Router();
const {
  getDonors,
  toggleAvailability,
  updateLocation
} = require('../controllers/donorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', getDonors);
router.put('/availability', protect, authorize('donor'), toggleAvailability);
router.put('/location', protect, authorize('donor'), updateLocation);

module.exports = router;
