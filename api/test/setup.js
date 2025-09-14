import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup test database before all tests
beforeAll(async () => {
  // Disconnect from any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and stop MongoDB after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.SESSION_SECRET = 'test-secret';
process.env.JUNO_APPLICATION_ID = 'test-app-id';
process.env.JUNO_SECRET_KEY = 'test-secret-key';
process.env.JUNO_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.JUNOPAY_AUTHORIZE_URL = 'https://test.junopay.com/authorize';
process.env.JUNOPAY_TOKEN_URL = 'https://test.junopay.com/token';
process.env.JUNOPAY_API_BASE_URL = 'https://test.junopay.com/api';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};