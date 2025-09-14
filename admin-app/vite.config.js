import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: [
      'localhost',
      'admin.a2842d04cca8.ngrok-free.app',
      'a2842d04cca8.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});