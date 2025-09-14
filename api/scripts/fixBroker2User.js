import mongoose from 'mongoose';
import User from '../db/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixBroker2User() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user with email that looks like a juno_id (not a proper email)
    // or find by the specific email
    const problematicUsers = await User.find({
      $or: [
        { email: { $regex: /^client\d+$/ } }, // Matches patterns like "client1234567"
        { email: 'broker2@junomoney.com' },
        { name: { $regex: /^client\d+$/ } }  // Name that looks like client ID
      ]
    });

    console.log(`Found ${problematicUsers.length} potentially problematic users`);

    for (const user of problematicUsers) {
      console.log('\nUser found:');
      console.log('  ID:', user._id);
      console.log('  Juno ID:', user.juno_id);
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Company:', user.company_name);

      // If this is broker2, we can either delete or update
      if (user.email === 'broker2@junomoney.com' || user.name === 'broker2@junomoney.com') {
        console.log('\nThis appears to be broker2 - fixing...');
        
        // Option 1: Delete the user so they can re-authenticate
        await User.deleteOne({ _id: user._id });
        console.log('Deleted user so they can re-authenticate with correct data');
        
        // Option 2: Update with correct data (uncomment if you prefer this)
        // user.email = 'broker2@junomoney.com';
        // user.name = 'Broker2';
        // user.company_name = 'JunoPay User';
        // await user.save();
        // console.log('Updated user with correct data');
      } else if (user.email.match(/^client\d+$/)) {
        // This user has a client ID as email, which is wrong
        console.log('\nThis user has incorrect email format - deleting...');
        await User.deleteOne({ _id: user._id });
        console.log('Deleted user with invalid email format');
      }
    }

    console.log('\nUser fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing users:', error);
    process.exit(1);
  }
}

fixBroker2User();