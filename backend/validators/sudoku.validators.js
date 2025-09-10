import Joi from 'joi';

/**
 * Sudoku validation schemas using Joi
 */

// Sudoku grid validation - 9x9 array with numbers 0-9
const sudokuGridSchema = Joi.array()
  .length(9)
  .items(
    Joi.array()
      .length(9)
      .items(
        Joi.number()
          .integer()
          .min(0)
          .max(9)
          .required()
      )
      .required()
  )
  .required();

// Difficulty validation
const difficultySchema = Joi.string()
  .valid('easy', 'medium', 'hard', 'expert')
  .default('medium');

// Solve puzzle request validation
export const solvePuzzleSchema = Joi.object({
  grid: sudokuGridSchema
});

// Generate puzzle request validation
export const generatePuzzleSchema = Joi.object({
  difficulty: difficultySchema
});

// Save puzzle request validation
export const savePuzzleSchema = Joi.object({
  puzzleGrid: sudokuGridSchema,
  solutionGrid: sudokuGridSchema,
  difficulty: difficultySchema
});

/**
 * Validate that a Sudoku grid follows Sudoku rules
 * This is a custom validation function for more advanced checks
 */
export function validateSudokuRules(grid) {
  const errors = [];

  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col];
      if (value !== 0) {
        if (seen.has(value)) {
          errors.push(`Duplicate ${value} in row ${row + 1}`);
        }
        seen.add(value);
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const value = grid[row][col];
      if (value !== 0) {
        if (seen.has(value)) {
          errors.push(`Duplicate ${value} in column ${col + 1}`);
        }
        seen.add(value);
      }
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          const value = grid[row][col];
          if (value !== 0) {
            if (seen.has(value)) {
              errors.push(`Duplicate ${value} in box (${boxRow + 1}, ${boxCol + 1})`);
            }
            seen.add(value);
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate image file for puzzle upload
 */
export const imageUploadSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string().valid(
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ).required(),
  size: Joi.number().max(10 * 1024 * 1024).required(), // 10MB limit
  buffer: Joi.binary().required()
});

export default {
  solvePuzzleSchema,
  generatePuzzleSchema,
  savePuzzleSchema,
  validateSudokuRules,
  imageUploadSchema
};
