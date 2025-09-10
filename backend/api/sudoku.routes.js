import express from 'express';
import multer from 'multer';

import { solveSudoku, generateSudoku } from '../services/sudoku.service.js';
import { processAndSolveImage } from '../services/image.service.js';
import Puzzle from '../models/puzzle.model.js';
import { solveLimiter, generateLimiter, uploadLimiter, modificationLimiter } from '../config/security.js';
import {
  solvePuzzleSchema,
  generatePuzzleSchema,
  savePuzzleSchema,
  validateSudokuRules,
  imageUploadSchema
} from '../validators/sudoku.validators.js';

import { isAuth } from './middleware/auth.middleware.js';
import { validateJoi, validateFile, validateCustom } from './middleware/validation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sudoku
 *   description: Sudoku puzzle solving, generation, and image processing
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SudokuGrid:
 *       type: array
 *       items:
 *         type: array
 *         items:
 *           type: integer
 *           minimum: 0
 *           maximum: 9
 *       description: '9x9 Sudoku grid where 0 represents empty cells'
 *       example: [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]
 *     SudokuSolution:
 *       type: array
 *       items:
 *         type: array
 *         items:
 *           type: integer
 *           minimum: 1
 *           maximum: 9
 *       description: '9x9 Sudoku solution grid with all cells filled'
 *       example: [[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]]
 *     GeneratePuzzleRequest:
 *       type: object
 *       properties:
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard, expert]
 *           description: 'Difficulty level for puzzle generation'
 *           example: 'medium'
 *     GeneratePuzzleResponse:
 *       type: object
 *       properties:
 *         puzzle:
 *           $ref: '#/components/schemas/SudokuGrid'
 *         solution:
 *           $ref: '#/components/schemas/SudokuSolution'
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard, expert]
 *           example: 'medium'
 *     SolvePuzzleRequest:
 *       type: object
 *       required:
 *         - grid
 *       properties:
 *         grid:
 *           $ref: '#/components/schemas/SudokuGrid'
 *     SolvePuzzleResponse:
 *       type: object
 *       properties:
 *         solution:
 *           $ref: '#/components/schemas/SudokuSolution'
 */

// Multer setup for image uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * /api/sudoku/solve:
 *   post:
 *     summary: Solve a Sudoku puzzle
 *     description: Solves a provided Sudoku puzzle using backtracking algorithm
 *     tags: [Sudoku]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SolvePuzzleRequest'
 *     responses:
 *       200:
 *         description: Puzzle solved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SolvePuzzleResponse'
 *       400:
 *         description: Invalid puzzle grid or no solution exists
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       example: 'No solution exists for the given puzzle'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/solve', 
  solveLimiter,
  validateJoi(solvePuzzleSchema),
  validateCustom(validateSudokuRules, 'body'),
  (req, res) => {
  const { grid } = req.body;
  // Validation middleware already handled grid validation

  const solution = solveSudoku(grid);

  if (solution) {
    res.json({ solution });
  } else {
    res.status(400).json({ msg: 'No solution exists for the given puzzle.' });
  }
});

/**
 * @swagger
 * /api/sudoku/solve-from-image:
 *   post:
 *     summary: Solve Sudoku from image
 *     description: Upload an image of a Sudoku puzzle and get the solution using OCR and AI processing
 *     tags: [Sudoku]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sudokuImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file containing a Sudoku puzzle (jpg, png, etc.)
 *             required:
 *               - sudokuImage
 *     responses:
 *       200:
 *         description: Puzzle solved from image successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SolvePuzzleResponse'
 *       400:
 *         description: No image uploaded or could not solve puzzle from image
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       example: 'Could not solve puzzle from image'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/solve-from-image', 
  uploadLimiter,
  upload.single('sudokuImage'),
  validateFile(imageUploadSchema),
  async (req, res) => {
    // File validation middleware already handled file validation

    try {
        const solution = await processAndSolveImage(req.file);
        if (solution) {
            res.json({ solution });
        } else {
            // This is the expected response from the placeholder
            res.status(400).json({ msg: 'Could not solve puzzle from image.' });
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /api/sudoku/generate:
 *   get:
 *     summary: Generate a new Sudoku puzzle
 *     description: Creates a new Sudoku puzzle with specified difficulty level
 *     tags: [Sudoku]
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard, expert]
 *           default: medium
 *         description: Difficulty level for the generated puzzle
 *     responses:
 *       200:
 *         description: New puzzle generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneratePuzzleResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/generate', 
  generateLimiter,
  validateJoi(generatePuzzleSchema, 'query'),
  (req, res) => {
  const { difficulty } = req.query;
  const result = generateSudoku(difficulty);
  res.json(result);
});

/**
 * @swagger
 * /api/sudoku/save:
 *   post:
 *     summary: Save a Sudoku puzzle
 *     description: Save a Sudoku puzzle and its solution to the database (requires authentication)
 *     tags: [Sudoku]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - puzzle
 *               - solution
 *             properties:
 *               puzzle:
 *                 $ref: '#/components/schemas/SudokuGrid'
 *               solution:
 *                 $ref: '#/components/schemas/SudokuSolution'
 *     responses:
 *       201:
 *         description: Puzzle saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Puzzle'
 *       400:
 *         description: Puzzle and solution are required
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       example: 'Puzzle and solution are required'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/save', 
  modificationLimiter,
  isAuth, 
  validateJoi(savePuzzleSchema),
  validateCustom(validateSudokuRules, 'body.puzzle'),
  validateCustom(validateSudokuRules, 'body.solution'),
  async (req, res) => {
    try {
        const { puzzle, solution } = req.body;
        if (!puzzle || !solution) {
            return res.status(400).json({ msg: 'Puzzle and solution are required.' });
        }

        const newPuzzle = new Puzzle({
            puzzleGrid: puzzle,
            solutionGrid: solution,
        });

        const savedPuzzle = await newPuzzle.save();
        res.status(201).json(savedPuzzle);

    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        res.status(500).send('Server Error');
    }
});

/**
 * @swagger
 * /api/sudoku/{id}:
 *   get:
 *     summary: Get a saved puzzle by ID
 *     description: Retrieves a specific Sudoku puzzle from the database by its ID
 *     tags: [Sudoku]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the puzzle
 *         example: '507f1f77bcf86cd799439012'
 *     responses:
 *       200:
 *         description: Puzzle retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Puzzle'
 *       404:
 *         description: Puzzle not found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       example: 'Puzzle not found'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', async (req, res) => {
    try {
        const puzzle = await Puzzle.findById(req.params.id);
        if (!puzzle) {
            return res.status(404).json({ msg: 'Puzzle not found.' });
        }
        res.json(puzzle);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Puzzle not found.' });
        }
        res.status(500).send('Server Error');
    }
});


export default router;
