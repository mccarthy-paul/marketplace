import dotenv from 'dotenv'; // Import dotenv
dotenv.config({ path: '../api/.env' }); // Load environment variables from api/.env

import connectDB from '../api/db/index.js'; // Import the connectDB function
import User from '../api/db/userModel.js'; // Import the User model
// TODO: Import bcrypt for password hashing

const createAdminUser = async () => {
  console.log('MONGODB_URI:', process.env.MONGODB_URI); // Log the environment variable
  await connectDB(); // Wait for database connection
  const email = 'admin@luxe24.com';
  const password = 'admin'; // WARNING: Storing password in plain text is insecure. Use bcrypt in production.

  try {
    // Find the user with the specified email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      console.log('Please run the script to create the user first.');
      return;
    }

    // TODO: Hash the password with bcrypt before saving
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = password; // WARNING: Replace with hashedPassword in production
    await user.save();

    console.log(`Password updated for user with email ${email} successfully.`);
  } catch (err) {
    console.error('Error updating user password:', err);
  } finally {
    // Disconnect from the database after the operation
    // TODO: Find a way to properly disconnect Mongoose after script execution
    // For now, the script might keep the process alive due to the database connection.
    // In a real application, manage database connections more carefully in scripts.
    process.exit(0); // Force exit for demonstration
  }
};

createAdminUser();
