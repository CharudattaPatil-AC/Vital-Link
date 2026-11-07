const mongoose = require('mongoose');
const { getISTDate, getISTString } = require('../utils/istTime');

const reservationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  facilityType: { type: String, enum: ['hospital'], default: 'hospital' },
  facilityName: String,
  resourceType: {
    type: String,
    enum: ['icuBed', 'generalBed', 'oxygenCylinder', 'ventilator'],
    required: true
  },
  quantity: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: String,
  createdAtIST: { type: String, default: getISTString },
  updatedAtIST: { type: String, default: getISTString }
}, {
  timestamps: {
    currentTime: getISTDate
  }
});

reservationSchema.pre('save', function () {
  const istStr = getISTString();
  if (!this.createdAtIST) {
    this.createdAtIST = istStr;
  }
  this.updatedAtIST = istStr;
});

module.exports = mongoose.model('Reservation', reservationSchema);
