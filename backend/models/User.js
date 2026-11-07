const mongoose = require('mongoose');
const { getISTDate, getISTString } = require('../utils/istTime');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'hospital', 'bloodbank', 'patient'],
    default: 'patient'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  dateOfBirth: Date,
  createdAtIST: { type: String, default: getISTString },
  updatedAtIST: { type: String, default: getISTString }
}, {
  timestamps: {
    currentTime: getISTDate
  }
});

userSchema.pre('save', function () {
  const istStr = getISTString();
  if (!this.createdAtIST) {
    this.createdAtIST = istStr;
  }
  this.updatedAtIST = istStr;
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
