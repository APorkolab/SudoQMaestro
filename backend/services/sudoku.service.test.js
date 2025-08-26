import { solveSudoku, generateSudoku } from './sudoku.service.js';

describe('Sudoku Service', () => {
  describe('solveSudoku', () => {
    it('should solve a valid Sudoku puzzle', () => {
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
      const solution = solveSudoku(puzzle);
      expect(solution).toEqual(expectedSolution);
    });

    it('should return null for an unsolvable puzzle', () => {
      const puzzle = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [5, 0, 0, 0, 8, 0, 0, 7, 9], // Invalid puzzle (two 5s in first column)
      ];
      const solution = solveSudoku(puzzle);
      // The current solver might not detect invalid initial puzzles gracefully,
      // but it should fail to find a solution.
      expect(solution).toBeNull();
    });
  });

  describe('generateSudoku', () => {
    it('should generate a puzzle and a full solution', () => {
      const { puzzle, solution } = generateSudoku('easy');

      expect(puzzle).toHaveLength(9);
      expect(puzzle[0]).toHaveLength(9);
      expect(solution).toHaveLength(9);
      expect(solution[0]).toHaveLength(9);

      // Check if puzzle has empty cells
      const hasEmptyCells = puzzle.flat().some(cell => cell === 0);
      expect(hasEmptyCells).toBe(true);

      // Check if solution has no empty cells
      const solutionHasEmptyCells = solution.flat().some(cell => cell === 0);
      expect(solutionHasEmptyCells).toBe(false);
    });
  });
});
