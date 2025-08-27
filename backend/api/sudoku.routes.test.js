import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import sudokuRoutes from './sudoku.routes.js'; // The router we want to test
import mongoose from 'mongoose';

// We need to create a minimal app to test the router in isolation
const app = express();
app.use(express.json());
app.use('/api/sudoku', sudokuRoutes);

// Mock the database connection before running tests
beforeAll(async () => {
    // For integration tests, it's better to use an in-memory database,
    // but for now, we'll just ensure mongoose doesn't throw errors.
    // We can spy on connect and mock it.
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve());
});

afterAll(() => {
    // Restore the original mongoose.connect after all tests
    mongoose.connect.mockRestore();
});


describe('Sudoku API Routes', () => {
  describe('GET /api/sudoku/generate', () => {
    it('should return a new puzzle and solution', async () => {
      const res = await request(app).get('/api/sudoku/generate?difficulty=easy');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('puzzle');
      expect(res.body).toHaveProperty('solution');
      expect(res.body.puzzle).toHaveLength(9);
      expect(res.body.solution).toHaveLength(9);
    });
  });

  describe('POST /api/sudoku/solve', () => {
    it('should solve a given puzzle', async () => {
      const puzzle = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ];

      const res = await request(app)
        .post('/api/sudoku/solve')
        .send({ grid: puzzle });

      const expectedSolution = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ];

      expect(res.statusCode).toEqual(200);
      expect(res.body.solution).toEqual(expectedSolution);
    });

    it('should return a 400 error if the puzzle is invalid', async () => {
        const res = await request(app)
            .post('/api/sudoku/solve')
            .send({ grid: {} }); // Invalid grid

        expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/sudoku/solve-from-image', () => {
    it('should return 400 if no file is uploaded', async () => {
        const res = await request(app).post('/api/sudoku/solve-from-image');
        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toEqual('No image file uploaded.');
    });

    it('should return an error when uploading a non-image file', async () => {
        const res = await request(app)
            .post('/api/sudoku/solve-from-image')
            .attach('sudokuImage', 'api/test-image.txt');

        // The service should fail gracefully. Depending on the error, it might be 400 or 500.
        // The main thing is that the server does not crash.
        // Our placeholder returns 400, but a real failure in Jimp might be 500.
        // Let's expect that it's a client-side error for now.
        expect(res.statusCode).toBe(400);
        expect(res.body.msg).toEqual('Could not solve puzzle from image.');
    });
  });
});
