const mongoose = require('mongoose');

const donationCampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    organizerModel: {
      type: String,
      enum: ['Hospital', 'BloodBank'],
      default: 'BloodBank'
    },
    organizerName: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    venue: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    contactPhone: {
      type: String,
      required: true
    },
    targetUnits: {
      type: Number,
      default: 100
    },
    collectedUnits: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [78.9629, 20.5937]
      }
    },
    registeredDonors: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        donorName: String,
        bloodGroup: String,
        phone: String,
        email: String,
        registeredAt: {
          type: Date,
          default: Date.now
        },
        attended: {
          type: Boolean,
          default: false
        },
        unitsDonated: {
          type: Number,
          default: 1
        },
        certificateId: {
          type: String
        }
      }
    ]
  },
  { timestamps: true }
);

donationCampSchema.index({ location: '2dsphere' });
donationCampSchema.index({ state: 1, city: 1, status: 1 });

module.exports = mongoose.model('DonationCamp', donationCampSchema);
