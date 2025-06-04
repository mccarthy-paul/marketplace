import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  watch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Watch', required: true },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  is_available: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
