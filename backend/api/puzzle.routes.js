import express from 'express';
import { isAuth } from './middleware/auth.middleware.js';

// Factory function for puzzle routes
export default (Puzzle) => {
  const router = express.Router();

  // @route   POST /api/puzzles
  // @desc    Save a new puzzle for the logged-in user
  // @access  Private
  router.post('/', isAuth, async (req, res) => {
    try {
      const { puzzleGrid, solutionGrid, difficulty } = req.body;

      // Basic validation
      if (!puzzleGrid || !solutionGrid) {
        return res.status(400).json({ msg: 'Puzzle and solution grids are required.' });
      }

      const newPuzzle = new Puzzle({
        user: req.user.id, // req.user is available from isAuth middleware
        puzzleGrid,
        solutionGrid,
        difficulty,
      });

      const puzzle = await newPuzzle.save();
      res.json(puzzle);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  // @route   GET /api/puzzles
  // @desc    Get all saved puzzles for the logged-in user
  // @access  Private
  router.get('/', isAuth, async (req, res) => {
    try {
      const puzzles = await Puzzle.find({ user: req.user.id }).sort({ createdAt: -1 });
      res.json(puzzles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  return router;
};
