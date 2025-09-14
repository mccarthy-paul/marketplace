import mongoose from 'mongoose';
import User from '../db/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function addBroker2() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if broker2 already exists
    const existingUser = await User.findOne({ email: 'broker2@junomoney.com' });
    
    if (existingUser) {
      console.log('User broker2@junomoney.com already exists:', existingUser);
      process.exit(0);
    }

    // Create broker2 user
    const broker2 = new User({
      juno_id: 'broker2_juno_id', // You can update this with the actual Juno ID later
      junopay_client_id: 'client2_placeholder', // Update when you have the actual client ID
      email: 'broker2@junomoney.com',
      name: 'Broker2',
      company_name: 'JunoPay User',
      is_admin: false,
      buyer_fee: 2.5, // Default buyer fee percentage
      seller_fee: 2.5, // Default seller fee percentage
      access_token: null,
      refresh_token: null
    });

    await broker2.save();
    console.log('Successfully created broker2 user:', broker2);
    
    console.log('\nUser created with:');
    console.log('  Email:', broker2.email);
    console.log('  Name:', broker2.name);
    console.log('  Company:', broker2.company_name);
    console.log('  ID:', broker2._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating broker2 user:', error);
    process.exit(1);
  }
}

addBroker2();