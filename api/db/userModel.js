import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  juno_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  company_name: { type: String, required: true },
  password: { type: String, select: false }, // Added password field with select: false
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

export default User;
