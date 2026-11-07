const mongoose = require('mongoose');
const { getISTDate, getISTString } = require('../utils/istTime');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['unread', 'read', 'resolved'],
    default: 'unread'
  },
  createdAtIST: { type: String, default: getISTString },
  updatedAtIST: { type: String, default: getISTString }
}, {
  timestamps: {
    currentTime: getISTDate
  }
});

contactMessageSchema.pre('save', function () {
  const istStr = getISTString();
  if (!this.createdAtIST) {
    this.createdAtIST = istStr;
  }
  this.updatedAtIST = istStr;
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);

