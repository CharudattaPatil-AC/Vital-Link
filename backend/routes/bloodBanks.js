const express = require('express');
const router = express.Router();
const {
  getBloodBanks,
  getBloodBankById,
  createBloodBank,
  updateInventory,
  getMyBloodBank,
  toggleVerifyBloodBank,
  getScarcityAnalytics,
  getFacilityAutoRequests,
  triggerFacilityAutoCheck
} = require('../controllers/bloodBankController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', getBloodBanks);
router.get('/analytics/scarcity', getScarcityAnalytics);
router.get('/my', protect, authorize('bloodbank', 'admin'), getMyBloodBank);
router.get('/:id', getBloodBankById);
router.get('/:id/auto-requests', protect, getFacilityAutoRequests);
router.post('/:id/auto-check', protect, authorize('bloodbank', 'admin'), triggerFacilityAutoCheck);
router.post('/', protect, authorize('bloodbank', 'admin'), createBloodBank);
router.put('/:id/inventory', protect, authorize('bloodbank', 'admin'), updateInventory);
router.put('/:id/verify', protect, authorize('admin'), toggleVerifyBloodBank);

module.exports = router;
