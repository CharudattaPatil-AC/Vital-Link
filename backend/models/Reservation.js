const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  facilityType: { type: String, enum: ['hospital', 'bloodbank'], required: true },
  facilityName: String,
  resourceType: {
    type: String,
    enum: ['icuBed', 'generalBed', 'oxygenCylinder', 'ventilator', 'blood'],
    required: true
  },
  bloodGroup: String,
  quantity: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'expired', 'completed'],
    default: 'pending'
  },
  expiresAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
