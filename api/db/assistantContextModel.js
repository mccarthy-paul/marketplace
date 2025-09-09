import mongoose from 'mongoose';

const assistantContextSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  contextData: {
    recentWatches: [{
      watchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Watch'
      },
      viewedAt: {
        type: Date,
        default: Date.now
      },
      interactionType: {
        type: String,
        enum: ['viewed', 'searched', 'bid', 'favorited']
      }
    }],
    activeBids: [{
      bidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid'
      },
      watchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Watch'
      },
      amount: Number,
      status: String,
      createdAt: Date
    }],
    preferences: {
      preferredBrands: [String],
      priceRange: {
        min: Number,
        max: Number
      },
      watchTypes: [String],
      notifications: {
        bidUpdates: {
          type: Boolean,
          default: true
        },
        newListings: {
          type: Boolean,
          default: false
        },
        priceDrops: {
          type: Boolean,
          default: false
        }
      }
    },
    searchHistory: [{
      query: String,
      filters: Object,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
assistantContextSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  this.contextData.lastUpdated = Date.now();
  next();
});

const AssistantContext = mongoose.model('AssistantContext', assistantContextSchema);

export default AssistantContext;
