import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import puzzleRoutesFactory from './puzzle.routes.js';

// Helper function to create a test app instance
const createApp = (user, mockPuzzleModel) => {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.user = user;
    // Mock the isAuthenticated function that the real isAuth middleware relies on
    req.isAuthenticated = () => !!user;
    next();
  });

  const puzzleRoutes = puzzleRoutesFactory(mockPuzzleModel);
  app.use('/api/puzzles', puzzleRoutes);

  return app;
};

describe('Puzzle API Routes', () => {
  // Mock the Puzzle model constructor and its methods
  const mockPuzzleInstance = {
    save: jest.fn(),
  };
  // The model itself is a constructor function
  const MockPuzzleModel = jest.fn(() => mockPuzzleInstance);
  // It also has static methods like 'find'
  MockPuzzleModel.find = jest.fn();

  const mockUser = { id: 'user123', name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/puzzles', () => {
    it('should return 200 OK and the saved puzzle for an authenticated user', async () => {
      const puzzleData = { puzzleGrid: [[1]], solutionGrid: [[1]], difficulty: 'easy' };
      mockPuzzleInstance.save.mockResolvedValue({ ...puzzleData, user: mockUser.id });

      const app = createApp(mockUser, MockPuzzleModel);
      const res = await request(app)
        .post('/api/puzzles')
        .send(puzzleData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(mockUser.id);
      expect(MockPuzzleModel).toHaveBeenCalledWith(expect.objectContaining({ user: mockUser.id }));
      expect(mockPuzzleInstance.save).toHaveBeenCalledTimes(1);
    });

    it('should return 401 UNAUTHORIZED if user is not authenticated', async () => {
      const app = createApp(null, MockPuzzleModel); // No user
      const res = await request(app)
        .post('/api/puzzles')
        .send({ puzzleGrid: [[1]], solutionGrid: [[1]] });

      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 BAD REQUEST if required fields are missing', async () => {
        const app = createApp(mockUser, MockPuzzleModel);
        const res = await request(app)
          .post('/api/puzzles')
          .send({ }); // Missing grids

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toEqual('Puzzle and solution grids are required.');
      });
  });

  describe('GET /api/puzzles', () => {
    it('should return 200 OK and a list of puzzles for an authenticated user', async () => {
      const mockPuzzles = [{ _id: 'puzzle1' }, { _id: 'puzzle2' }];
      // The find method returns an object that can be sorted.
      MockPuzzleModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPuzzles),
      });

      const app = createApp(mockUser, MockPuzzleModel);
      const res = await request(app).get('/api/puzzles');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockPuzzles);
      expect(MockPuzzleModel.find).toHaveBeenCalledWith({ user: mockUser.id });
    });

    it('should return 401 UNAUTHORIZED if user is not authenticated', async () => {
        const app = createApp(null, MockPuzzleModel);
        const res = await request(app).get('/api/puzzles');

        expect(res.statusCode).toEqual(401);
      });
  });
});
