const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getHospitalById,
  createHospital,
  updateInventory,
  getMyHospital,
  toggleVerifyHospital
} = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', getHospitals);
router.get('/my', protect, authorize('hospital', 'admin'), getMyHospital);
router.get('/:id', getHospitalById);
router.post('/', protect, authorize('hospital', 'admin'), createHospital);
router.put('/:id/inventory', protect, authorize('hospital', 'admin'), updateInventory);
router.put('/:id/verify', protect, authorize('admin'), toggleVerifyHospital);

module.exports = router;
