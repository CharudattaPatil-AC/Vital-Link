const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  compatibleGroups: [{ type: String }],
  unitsNeeded: { type: Number, required: true },
  urgency: {
    type: String,
    enum: ['critical', 'urgent', 'normal'],
    default: 'normal'
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  radius: { type: Number, default: 5000 },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active'
  },
  matchedDonors: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donorBloodGroup: String,
    matchTier: { type: Number, default: 1 }, // 1: Exact, 2: Compatible Rh-, 3: Universal Rh+, 4: Universal Reserve
    matchLabel: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    respondedAt: Date
  }],
  contactPhone: { type: String, required: true },
  hospitalName: String
}, { timestamps: true });

bloodRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
