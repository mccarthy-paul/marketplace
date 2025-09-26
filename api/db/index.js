import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async (retryAttempt = 1, maxRetries = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${retryAttempt}/${maxRetries}):`, err);

    if (retryAttempt < maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000); // Exponential backoff, max 10s
      console.log(`Retrying MongoDB connection in ${retryDelay}ms...`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(connectDB(retryAttempt + 1, maxRetries));
        }, retryDelay);
      });
    } else {
      console.error('Max MongoDB connection retries exceeded. Server will continue without database.');
      return false;
    }
  }
};

export default connectDB;
