import mongoose from 'mongoose';

const watchSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  reference_number: { type: String, required: true, unique: true },
  description: { type: String },
  year: { type: Number },
  condition: { type: String },
  imageUrl: { type: String }, // Added imageUrl field
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added seller field referencing User model
  currentBid: {
    type: Number,
    default: 0,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active',
  },
  price: {
    type: Number,
    required: false, // Making it optional for now, can change later if needed
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Watch = mongoose.model('Watch', watchSchema);

export default Watch;
