import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  applicationTransactionId: {
    type: String,
    required: true,
    unique: true
  },
  watch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Watch',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerClientId: {
    type: String,
    required: true
  },
  sellerClientId: {
    type: String,
    required: true
  },
  productName: String,
  productCode: String,
  currency: {
    type: String,
    default: 'USD'
  },
  purchasePrice: {
    type: String,
    required: true
  },
  shippingPrice: {
    type: String,
    default: '0'
  },
  totalPrice: {
    type: String,
    required: true
  },
  buyerFee: {
    type: String,
    default: '0'
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'confirmed', 'cancelled', 'completed', 'failed'],
    default: 'initiated'
  },
  buyerNote: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;