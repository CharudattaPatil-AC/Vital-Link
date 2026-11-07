const express = require('express');
const router = express.Router();
const {
  getBloodBanks,
  getBloodBankById,
  createBloodBank,
  updateInventory,
  getMyBloodBank,
  toggleVerifyBloodBank
} = require('../controllers/bloodBankController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', getBloodBanks);
router.get('/my', protect, authorize('bloodbank', 'admin'), getMyBloodBank);
router.get('/:id', getBloodBankById);
router.post('/', protect, authorize('bloodbank', 'admin'), createBloodBank);
router.put('/:id/inventory', protect, authorize('bloodbank', 'admin'), updateInventory);
router.put('/:id/verify', protect, authorize('admin'), toggleVerifyBloodBank);

module.exports = router;
