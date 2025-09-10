import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

import adminRoutesFactory from './admin.routes.js';

// Updated helper to accept both mock models
const createApp = (user, mockUserModel, mockPuzzleModel) => {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.user = user;
    next();
  });

  // Pass both models to the factory
  const adminRoutes = adminRoutesFactory(mockUserModel, mockPuzzleModel);
  app.use('/api/admin', adminRoutes);

  return app;
};

describe('Admin API Routes', () => {
  // Mock User model setup
  const mockUserModel = {
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findById: jest.fn(),
  };
  const mockUserInstance = {
    role: 'user',
    save: jest.fn(),
  };

  // Mock Puzzle model setup
  const mockPuzzleModel = {
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockAdmin = { role: 'admin' };
  const mockNonAdmin = { role: 'user' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserInstance.save.mockClear();
  });

  // --- User Management Tests ---
  describe('User Routes', () => {
    describe('GET /api/admin/users', () => {
      it('should return 200 OK and all users for an admin', async () => {
        const mockUsers = [{ name: 'Admin User', role: 'admin' }];
        mockUserModel.find.mockResolvedValue(mockUsers);
        const app = createApp(mockAdmin, mockUserModel, mockPuzzleModel);
        const res = await request(app).get('/api/admin/users');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockUsers);
      });

      it('should return 403 FORBIDDEN for a non-admin', async () => {
        const app = createApp(mockNonAdmin, mockUserModel, mockPuzzleModel);
        const res = await request(app).get('/api/admin/users');
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /api/admin/users/:id', () => {
      const mockUserId = 'user123';
      it('should return 200 OK for an admin', async () => {
        mockUserModel.findByIdAndDelete.mockResolvedValue({ _id: mockUserId });
        const app = createApp(mockAdmin, mockUserModel, mockPuzzleModel);
        const res = await request(app).delete(`/api/admin/users/${mockUserId}`);
        expect(res.statusCode).toEqual(200);
      });

      it('should return 403 FORBIDDEN for a non-admin', async () => {
        const app = createApp(mockNonAdmin, mockUserModel, mockPuzzleModel);
        const res = await request(app).delete(`/api/admin/users/${mockUserId}`);
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /api/admin/users/:id', () => {
        const mockUserId = 'user123';
        it('should return 200 OK for an admin', async () => {
            mockUserModel.findById.mockResolvedValue(mockUserInstance);
            mockUserInstance.save.mockResolvedValue({ _id: mockUserId, role: 'admin' });
            const app = createApp(mockAdmin, mockUserModel, mockPuzzleModel);
            const res = await request(app).put(`/api/admin/users/${mockUserId}`).send({ role: 'admin' });
            expect(res.statusCode).toEqual(200);
        });

        it('should return 403 FORBIDDEN for a non-admin', async () => {
            const app = createApp(mockNonAdmin, mockUserModel, mockPuzzleModel);
            const res = await request(app).put(`/api/admin/users/${mockUserId}`).send({ role: 'admin' });
            expect(res.statusCode).toEqual(403);
        });
    });
  });

  // --- Puzzle Management Tests ---
  describe('Puzzle Routes', () => {
    describe('GET /api/admin/puzzles', () => {
      it('should return 200 OK and all puzzles for an admin', async () => {
        const mockPuzzles = [{ _id: 'puzzle1' }];
        // Mock the chainable methods
        mockPuzzleModel.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(mockPuzzles)
        });
        const app = createApp(mockAdmin, mockUserModel, mockPuzzleModel);
        const res = await request(app).get('/api/admin/puzzles');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockPuzzles);
      });

      it('should return 403 FORBIDDEN for a non-admin', async () => {
        const app = createApp(mockNonAdmin, mockUserModel, mockPuzzleModel);
        const res = await request(app).get('/api/admin/puzzles');
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('DELETE /api/admin/puzzles/:id', () => {
        const mockPuzzleId = 'puzzle123';
        it('should return 200 OK for an admin', async () => {
            mockPuzzleModel.findByIdAndDelete.mockResolvedValue({ _id: mockPuzzleId });
            const app = createApp(mockAdmin, mockUserModel, mockPuzzleModel);
            const res = await request(app).delete(`/api/admin/puzzles/${mockPuzzleId}`);
            expect(res.statusCode).toEqual(200);
        });

        it('should return 404 NOT FOUND if puzzle does not exist', async () => {
            mockPuzzleModel.findByIdAndDelete.mockResolvedValue(null);
            const app = createApp(mockAdmin, mockUserModel, mockPuzzleModel);
            const res = await request(app).delete(`/api/admin/puzzles/${mockPuzzleId}`);
            expect(res.statusCode).toEqual(404);
        });

        it('should return 403 FORBIDDEN for a non-admin', async () => {
            const app = createApp(mockNonAdmin, mockUserModel, mockPuzzleModel);
            const res = await request(app).delete(`/api/admin/puzzles/${mockPuzzleId}`);
            expect(res.statusCode).toEqual(403);
        });
    });
  });
});
