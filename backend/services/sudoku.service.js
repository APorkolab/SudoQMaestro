/**
 * Checks if a given number can be placed in a given cell of the Sudoku grid.
 * @param {number[][]} board - The 9x9 Sudoku grid.
 * @param {number} row - The row index.
 * @param {number} col - The column index.
 * @param {number} num - The number to check.
 * @returns {boolean} - True if the placement is valid, false otherwise.
 */
const isValid = (board, row, col, num) => {
  // Check if the number is already in the current row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) {
      return false;
    }
  }

  // Check if the number is already in the current column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) {
      return false;
    }
  }

  // Check if the number is already in the 3x3 subgrid
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Solves a Sudoku puzzle using a backtracking algorithm.
 * @param {number[][]} board - The 9x9 Sudoku grid.
 * @returns {boolean} - True if a solution is found, false otherwise. The board is modified in place.
 */
const solve = (board) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Find an empty cell (represented by 0)
      if (board[row][col] === 0) {
        // Try numbers 1 through 9
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;

            // Recursively try to solve the rest of the board
            if (solve(board)) {
              return true;
            }

            // If the recursive call did not lead to a solution, backtrack
            board[row][col] = 0;
          }
        }
        // If no number can be placed, the puzzle is unsolvable from this state
        return false;
      }
    }
  }
  // If all cells are filled, the puzzle is solved
  return true;
};

/**
 * Solves a Sudoku puzzle.
 * @param {number[][]} puzzleGrid - The 9x9 Sudoku grid to solve.
 * @returns {number[][] | null} - The solved grid, or null if no solution exists.
 */
export const solveSudoku = (puzzleGrid) => {
  // Create a deep copy of the grid to avoid modifying the original
  const grid = puzzleGrid.map(row => [...row]);
  if (solve(grid)) {
    return grid;
  }
  return null; // No solution found
};

/**
 * Generates a new Sudoku puzzle.
 * @param {string} difficulty - The desired difficulty ('easy', 'medium', 'hard').
 * @returns {{puzzle: number[][], solution: number[][]}} - The generated puzzle and its solution.
 */
export const generateSudoku = (difficulty = 'medium') => {
    // 1. Create a fully solved board
    const solution = Array(9).fill(0).map(() => Array(9).fill(0));
    // Fill the diagonal 3x3 boxes with random numbers
    fillDiagonal(solution);
    // Fill the remaining cells
    solve(solution);

    // 2. Poke holes in the board to create the puzzle
    const puzzle = solution.map(row => [...row]);
    let attempts = 5; // Adjust based on needs
    const removalCount = {
        easy: 40,
        medium: 50,
        hard: 60,
    };
    let count = removalCount[difficulty] || 50;

    while (count > 0 && attempts > 0) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            count--;
        } else {
            attempts--;
        }
    }

    return { puzzle, solution };
};

// Helper function to fill the diagonal 3x3 matrices for generation
const fillDiagonal = (board) => {
    for (let i = 0; i < 9; i = i + 3) {
        fillBox(board, i, i);
    }
};

// Helper function to fill a 3x3 box with random numbers
const fillBox = (board, row, col) => {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!isValid(board, row + i, col + j, num));
            board[row + i][col + j] = num;
        }
    }
};
