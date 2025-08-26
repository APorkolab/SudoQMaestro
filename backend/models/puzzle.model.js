import mongoose from 'mongoose';

const PuzzleSchema = new mongoose.Schema({
  puzzleGrid: {
    type: [[Number]],
    required: true,
  },
  solutionGrid: {
    type: [[Number]],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'custom'],
      default: 'custom',
  }
});

const Puzzle = mongoose.model('Puzzle', PuzzleSchema);

export default Puzzle;
