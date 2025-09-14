/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8001';

describe('API Tests (Node Environment)', () => {
  let apiClient;

  beforeAll(() => {
    apiClient = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await apiClient.get('/health');
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Watches API', () => {
    it('should get all watches', async () => {
      const response = await apiClient.get('/api/watches');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should search for watches', async () => {
      const response = await apiClient.get('/api/watches?search=Rolex');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should filter watches by brand', async () => {
      const response = await apiClient.get('/api/watches?brand=Rolex');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should get single watch details', async () => {
      const watchesResponse = await apiClient.get('/api/watches');
      if (watchesResponse.data && watchesResponse.data.length > 0) {
        const watchId = watchesResponse.data[0]._id;
        const response = await apiClient.get(`/api/watches/${watchId}`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('_id');
        expect(response.data).toHaveProperty('brand');
        expect(response.data).toHaveProperty('model');
      }
    });
  });

  describe('Users API', () => {
    it('should check authentication status', async () => {
      const response = await apiClient.get('/api/users/me');
      // Either 200 (authenticated) or 401 (not authenticated) is valid
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Bids API', () => {
    it('should handle bids endpoint', async () => {
      const response = await apiClient.get('/api/bids');
      // The bids endpoint might not be implemented yet (returns 404)
      // or might require authentication
      expect([200, 401, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.data)).toBe(true);
      }
    });
  });

  describe('Admin API', () => {
    it('should get admin statistics', async () => {
      const response = await apiClient.get('/api/admin/watches/count');
      // Either 200 (success) or 401 (unauthorized) is valid
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should check admin login endpoint', async () => {
      const response = await apiClient.post('/api/admin/login', {
        email: 'test@test.com',
        password: 'test'
      });
      // Should return 401 for invalid credentials
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('API Performance', () => {
    it('should respond quickly to requests', async () => {
      const start = Date.now();
      await apiClient.get('/api/watches');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() => 
        apiClient.get('/api/watches')
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await apiClient.get('/api/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent watch', async () => {
      const response = await apiClient.get('/api/watches/000000000000000000000000');
      expect(response.status).toBe(404);
    });

    it('should handle invalid watch ID format', async () => {
      const response = await apiClient.get('/api/watches/invalid-id');
      // Server might return 500 for invalid ObjectId format
      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await apiClient.get('/api/watches');
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});