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
    enum: ['offered', 'accepted', 'rejected', 'cancelled'], // Define possible status values
    default: 'offered',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
