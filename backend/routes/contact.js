const express = require('express');
const router = express.Router();
const { submitMessage, getMessages } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', submitMessage);
router.get('/', protect, authorize('admin'), getMessages);

module.exports = router;

