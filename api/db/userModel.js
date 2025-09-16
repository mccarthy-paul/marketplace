import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // JunoPay integration fields
  junopay_client_id: { type: String, required: true, unique: true },
  access_token: { type: String, select: false }, // JunoPay access token
  refresh_token: { type: String, select: false }, // JunoPay refresh token
  
  // User profile fields
  email: { type: String, required: true },
  name: { type: String, required: true },
  company_name: { type: String, required: true },
  buyer_fee: { type: Number }, // JunoPay buyer fee percentage
  
  // Default delivery address
  defaultDeliveryAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'USA' }
  },
  
  // Legacy fields (for backward compatibility)
  juno_id: { type: String }, // Optional legacy field
  password: { type: String, select: false }, // Legacy admin password
  
  // Seller statistics (computed/cached for performance)
  sellerStats: {
    totalSales: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    responseTime: { type: String }, // e.g., "Usually responds within 2 hours"
    memberSince: { type: Date },
    lastActive: { type: Date },
    badges: [{ type: String }] // e.g., ["Trusted Seller", "Fast Shipper", "100+ Sales"]
  },

  // Seller profile
  sellerProfile: {
    bio: { type: String, maxLength: 500 },
    specialties: [{ type: String }], // e.g., ["Rolex", "Vintage Watches", "Swiss Luxury"]
    location: { type: String },
    storeName: { type: String },
    returnPolicy: { type: String, maxLength: 1000 },
    shippingInfo: { type: String, maxLength: 1000 }
  },

  // System fields
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

export default User;
