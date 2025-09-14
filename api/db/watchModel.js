import mongoose from 'mongoose';

const watchSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  reference_number: { type: String, required: true, unique: true },
  description: { type: String },
  year: { type: Number },
  condition: { type: String },
  imageUrl: { type: String }, // Primary image (kept for backward compatibility)
  images: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return this.images.length <= 5;
      },
      message: 'A watch can have a maximum of 5 images'
    }
  }], // Array of image URLs (max 5)
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added seller field referencing User model
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added owner field referencing User model
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
    enum: ['active', 'sold', 'cancelled', 'pending'],
    default: 'active',
  },
  price: {
    type: Number,
    required: false, // Making it optional for now, can change later if needed
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SGD', 'HKD'],
    default: 'USD',
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Watch = mongoose.model('Watch', watchSchema);

export default Watch;
