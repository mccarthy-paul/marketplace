import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.join(__dirname, 'test-setup.js')],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: '../coverage',
      exclude: [
        'node_modules/',
        'scripts/',
        'config/',
        '*.config.js',
        '**/*.spec.js',
        '**/*.test.js'
      ]
    },
    reporters: ['default', 'json'],
    outputFile: '../reports/vitest-results.json'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../lib'),
      '@fixtures': path.resolve(__dirname, '../fixtures'),
      '@suites': path.resolve(__dirname, '../suites')
    }
  }
});