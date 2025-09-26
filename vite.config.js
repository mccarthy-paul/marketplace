import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      '65378701c270.ngrok.app',
      '.ngrok-free.app',
      '.ngrok.io'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true
      },
      '/public': {
        target: 'http://localhost:8001',
        changeOrigin: true
      },
    },
  },
});
