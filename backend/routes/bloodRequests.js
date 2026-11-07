const express = require('express');
const router = express.Router();
const {
  createBloodRequest,
  getBloodRequests,
  respondToRequest,
  getActiveRequests,
  escalateRequest,
  respondViaIVR,
  triggerAgentMonitoring
} = require('../controllers/bloodRequestController');
const { COMPATIBILITY_MATRIX } = require('../utils/bloodCompatibility');
const { protect } = require('../middleware/auth');

router.get('/compatibility-matrix', (req, res) => {
  res.json(COMPATIBILITY_MATRIX);
});
router.get('/active', getActiveRequests);
router.post('/', protect, createBloodRequest);
router.get('/', protect, getBloodRequests);
router.put('/:id/respond', protect, respondToRequest);
router.post('/:id/escalate', protect, escalateRequest);
router.post('/:id/ivr-action', protect, respondViaIVR);
router.post('/run-escalation-agent', protect, triggerAgentMonitoring);

module.exports = router;
