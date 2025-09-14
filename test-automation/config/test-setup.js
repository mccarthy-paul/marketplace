import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global setup
beforeAll(() => {
  console.log('🧪 Test suite starting...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

// Mock fetch if needed
global.fetch = global.fetch || (() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
  status: 200
}));