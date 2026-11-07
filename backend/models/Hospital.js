const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
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
  resources: {
    icuBeds: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } },
    generalBeds: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } },
    oxygenCylinders: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } },
    ventilators: { total: { type: Number, default: 0 }, available: { type: Number, default: 0 } }
  },
  operatingHours: { type: String, default: '24/7' }
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
