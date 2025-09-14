import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  watch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Watch',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  // Track if this came from a bid or direct purchase
  fromBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  },
  items: [cartItemSchema],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  deliveryMethod: {
    type: String,
    enum: ['shipping', 'collection', null],
    default: null
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
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

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + (this.shippingCost || 0);
  this.updated_at = new Date();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;