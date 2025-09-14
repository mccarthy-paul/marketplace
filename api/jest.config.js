export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?js$': ['babel-jest', { configFile: false, presets: ['@babel/preset-env'] }],
  },
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'db/**/*.js',
    '!db/index.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 85,
      statements: 85,
    },
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
};