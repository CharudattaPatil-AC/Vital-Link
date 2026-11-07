const mongoose = require('mongoose');
const { getISTDate, getISTString } = require('../utils/istTime');

const bloodBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  verified: { type: Boolean, default: false },
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inventory: [
    {
      bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true
      },
      unitsAvailable: { type: Number, default: 0 }
    }
  ],
  createdAtIST: { type: String, default: getISTString },
  updatedAtIST: { type: String, default: getISTString }
}, {
  timestamps: {
    currentTime: getISTDate
  }
});

bloodBankSchema.pre('save', function () {
  const istStr = getISTString();
  if (!this.createdAtIST) {
    this.createdAtIST = istStr;
  }
  this.updatedAtIST = istStr;
});

bloodBankSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
