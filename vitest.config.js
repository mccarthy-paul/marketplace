import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});