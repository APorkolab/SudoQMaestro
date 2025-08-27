import express from 'express';
import { isAdmin } from './middleware/admin.middleware.js';

// This is now a factory function that accepts User and Puzzle models as dependencies.
// This makes the router more testable as we can inject mock models.
export default (User, Puzzle) => {
  const router = express.Router();

  // @route   GET /api/admin/users
  // @desc    Get all users
  // @access  Private (Admin)
  router.get('/users', isAdmin, async (req, res) => {
    try {
      const users = await User.find({});
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  // @route   DELETE /api/admin/users/:id
  // @desc    Delete a user
  // @access  Private (Admin)
  router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      res.json({ msg: 'User deleted successfully' });
    } catch (err) {
      console.error(err.message);
      // Check for invalid ObjectId format, which Mongoose throws as a CastError
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server Error');
    }
  });

  // @route   PUT /api/admin/users/:id
  // @desc    Update a user's role
  // @access  Private (Admin)
  router.put('/users/:id', isAdmin, async (req, res) => {
    // For now, we only allow updating the role.
    const { role } = req.body;

    // Basic validation for the role
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
      // Using findById and save() to ensure middleware/hooks are triggered if any exist.
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Update the user object only if a role was provided
      if (role) {
        user.role = role;
      }

      const updatedUser = await user.save();

      res.json(updatedUser);
    } catch (err) {
      console.error(err.message);
      // Check for invalid ObjectId format
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server Error');
    }
  });

  // @route   GET /api/admin/puzzles
  // @desc    Get all puzzles from all users
  // @access  Private (Admin)
  router.get('/puzzles', isAdmin, async (req, res) => {
    try {
      const puzzles = await Puzzle.find({}).populate('user', 'displayName email').sort({ createdAt: -1 });
      res.json(puzzles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  // @route   DELETE /api/admin/puzzles/:id
  // @desc    Delete any puzzle
  // @access  Private (Admin)
  router.delete('/puzzles/:id', isAdmin, async (req, res) => {
    try {
      const puzzle = await Puzzle.findByIdAndDelete(req.params.id);

      if (!puzzle) {
        return res.status(404).json({ msg: 'Puzzle not found' });
      }

      res.json({ msg: 'Puzzle deleted successfully' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Puzzle not found' });
      }
      res.status(500).send('Server Error');
    }
  });

  return router;
};
