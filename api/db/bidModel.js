import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  watch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Watch',
    required: true,
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  ownerEmail: {
    type: String,
  },
  bidderEmail: {
    type: String,
  },
  bidderName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['offered', 'accepted', 'rejected', 'cancelled', 'counter_offer', 'negotiating'], // Added negotiation statuses
    default: 'offered',
  },
  // Track negotiation history
  negotiationHistory: [
    {
      amount: {
        type: Number,
        required: true,
      },
      proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      proposedByRole: {
        type: String,
        enum: ['buyer', 'seller'],
        required: true,
      },
      message: {
        type: String,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Final agreed price (when accepted)
  agreedPrice: {
    type: Number,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  comments: [
    {
      text: {
        type: String,
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
