import express from 'express';
import multer from 'multer';
import { solveSudoku, generateSudoku } from '../services/sudoku.service.js';
import { processAndSolveImage } from '../services/image.service.js';
import Puzzle from '../models/puzzle.model.js';
import { isAuth } from './middleware/auth.middleware.js';

const router = express.Router();

// Multer setup for image uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST /api/sudoku/solve
// @desc    Solves a Sudoku puzzle
// @access  Public
router.post('/solve', (req, res) => {
  const { grid } = req.body;

  if (!grid || !Array.isArray(grid)) {
    return res.status(400).json({ msg: 'Invalid puzzle grid provided.' });
  }

  const solution = solveSudoku(grid);

  if (solution) {
    res.json({ solution });
  } else {
    res.status(400).json({ msg: 'No solution exists for the given puzzle.' });
  }
});

// @route   POST /api/sudoku/solve-from-image
// @desc    Solves a Sudoku puzzle from an uploaded image
// @access  Public
router.post('/solve-from-image', upload.single('sudokuImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No image file uploaded.' });
    }

    try {
        const solution = await processAndSolveImage(req.file);
        if (solution) {
            res.json({ solution });
        } else {
            // This is the expected response from the placeholder
            res.status(400).json({ msg: 'Could not solve puzzle from image.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/sudoku/generate
// @desc    Generates a new Sudoku puzzle
// @access  Public
router.get('/generate', (req, res) => {
  const { difficulty } = req.query;
  const result = generateSudoku(difficulty);
  res.json(result);
});

// @route   POST /api/sudoku/save
// @desc    Saves a Sudoku puzzle and its solution
// @access  Private
router.post('/save', isAuth, async (req, res) => {
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
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/sudoku/:id
// @desc    Gets a saved puzzle by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const puzzle = await Puzzle.findById(req.params.id);
        if (!puzzle) {
            return res.status(404).json({ msg: 'Puzzle not found.' });
        }
        res.json(puzzle);
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Puzzle not found.' });
        }
        res.status(500).send('Server Error');
    }
});


export default router;
