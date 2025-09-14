import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Watches API Routes', () => {
  let app;
  let mongoServer;

  beforeEach(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create Express app with session middleware
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));

    // Mock authentication middleware
    app.use((req, res, next) => {
      if (req.path.includes('/admin')) {
        req.session.user = { _id: 'admin123', email: 'admin@test.com', is_admin: true };
      } else if (req.headers.authorization) {
        req.session.user = { _id: 'user123', email: 'user@test.com' };
      }
      next();
    });

    // Import and use the watches router
    const { default: watchesRouter } = await import('./watches.js');
    app.use('/api/watches', watchesRouter);
  });

  afterEach(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('GET /api/watches', () => {
    it('should return an empty array when no watches exist', async () => {
      const response = await request(app)
        .get('/api/watches')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return watches with filtering by brand', async () => {
      // First, add a watch to the database
      const { default: Watch } = await import('../db/watchModel.js');
      await Watch.create({
        brand: 'Rolex',
        model: 'Submariner',
        reference_number: '116610LN',
        price: 10000,
        condition: 'Excellent',
        year: 2020,
      });

      const response = await request(app)
        .get('/api/watches?brand=Rolex')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].brand).toBe('Rolex');
    });

    it('should filter watches by price range', async () => {
      const { default: Watch } = await import('../db/watchModel.js');
      await Watch.create([
        { brand: 'Rolex', model: 'Model1', price: 5000, reference_number: 'REF1' },
        { brand: 'Omega', model: 'Model2', price: 15000, reference_number: 'REF2' },
        { brand: 'Seiko', model: 'Model3', price: 25000, reference_number: 'REF3' },
      ]);

      const response = await request(app)
        .get('/api/watches?minPrice=10000&maxPrice=20000')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].price).toBe(15000);
    });
  });

  describe('POST /api/watches', () => {
    it('should require authentication to create a watch', async () => {
      const newWatch = {
        brand: 'Patek Philippe',
        model: 'Nautilus',
        reference_number: '5711/1A',
        price: 50000,
        condition: 'New',
        year: 2023,
      };

      const response = await request(app)
        .post('/api/watches')
        .send(newWatch)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });

    it('should create a new watch when authenticated', async () => {
      const newWatch = {
        brand: 'Patek Philippe',
        model: 'Nautilus',
        reference_number: '5711/1A',
        price: 50000,
        condition: 'New',
        year: 2023,
        description: 'Luxury sports watch',
      };

      const response = await request(app)
        .post('/api/watches')
        .set('Authorization', 'Bearer test-token')
        .send(newWatch)
        .expect(201);

      expect(response.body).toMatchObject({
        brand: 'Patek Philippe',
        model: 'Nautilus',
        reference_number: '5711/1A',
      });
      expect(response.body._id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidWatch = {
        brand: 'Rolex',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/watches')
        .set('Authorization', 'Bearer test-token')
        .send(invalidWatch)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/watches/:id', () => {
    it('should return a specific watch by ID', async () => {
      const { default: Watch } = await import('../db/watchModel.js');
      const watch = await Watch.create({
        brand: 'Audemars Piguet',
        model: 'Royal Oak',
        reference_number: '15400ST',
        price: 35000,
        condition: 'Excellent',
        year: 2021,
      });

      const response = await request(app)
        .get(`/api/watches/${watch._id}`)
        .expect(200);

      expect(response.body.brand).toBe('Audemars Piguet');
      expect(response.body.model).toBe('Royal Oak');
    });

    it('should return 404 for non-existent watch', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/watches/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Watch not found');
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/watches/invalid-id')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/watches/:id', () => {
    it('should update a watch when authenticated as owner', async () => {
      const { default: Watch } = await import('../db/watchModel.js');
      const watch = await Watch.create({
        brand: 'Tudor',
        model: 'Black Bay',
        reference_number: '79230N',
        price: 3500,
        condition: 'Good',
        year: 2020,
        owner: 'user123',
      });

      const updates = {
        price: 3800,
        condition: 'Excellent',
      };

      const response = await request(app)
        .put(`/api/watches/${watch._id}`)
        .set('Authorization', 'Bearer test-token')
        .send(updates)
        .expect(200);

      expect(response.body.price).toBe(3800);
      expect(response.body.condition).toBe('Excellent');
    });

    it('should prevent updating watch by non-owner', async () => {
      const { default: Watch } = await import('../db/watchModel.js');
      const watch = await Watch.create({
        brand: 'Cartier',
        model: 'Tank',
        reference_number: 'WSTA0029',
        price: 7000,
        owner: 'otheruser456',
      });

      const response = await request(app)
        .put(`/api/watches/${watch._id}`)
        .set('Authorization', 'Bearer test-token')
        .send({ price: 6500 })
        .expect(403);

      expect(response.body.message).toBe('Not authorized to update this watch');
    });
  });

  describe('DELETE /api/watches/:id', () => {
    it('should delete a watch when authenticated as owner', async () => {
      const { default: Watch } = await import('../db/watchModel.js');
      const watch = await Watch.create({
        brand: 'IWC',
        model: 'Portugieser',
        reference_number: 'IW371446',
        price: 7500,
        owner: 'user123',
      });

      await request(app)
        .delete(`/api/watches/${watch._id}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Verify watch is deleted
      const deletedWatch = await Watch.findById(watch._id);
      expect(deletedWatch).toBeNull();
    });

    it('should prevent deleting watch by non-owner', async () => {
      const { default: Watch } = await import('../db/watchModel.js');
      const watch = await Watch.create({
        brand: 'Jaeger-LeCoultre',
        model: 'Reverso',
        reference_number: 'Q3858520',
        price: 9000,
        owner: 'otheruser789',
      });

      const response = await request(app)
        .delete(`/api/watches/${watch._id}`)
        .set('Authorization', 'Bearer test-token')
        .expect(403);

      expect(response.body.message).toBe('Not authorized to delete this watch');

      // Verify watch still exists
      const existingWatch = await Watch.findById(watch._id);
      expect(existingWatch).not.toBeNull();
    });
  });
});