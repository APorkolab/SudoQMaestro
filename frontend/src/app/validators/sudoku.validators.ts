import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Angular form validators for SudoQMaestro
 */

export type SudokuGrid = (number | null)[][];

/**
 * Validates that a value is a valid Sudoku cell value (1-9 or empty)
 */
export function sudokuCellValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '' || control.value === undefined) {
      return null; // Empty cells are valid
    }

    const value = parseInt(control.value, 10);
    
    if (isNaN(value) || value < 1 || value > 9) {
      return { 
        invalidSudokuCell: { 
          value: control.value,
          message: 'Must be a number between 1-9' 
        } 
      };
    }

    return null;
  };
}

/**
 * Validates that a Sudoku grid is properly formatted (9x9)
 */
export function sudokuGridValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const grid = control.value;

    if (!grid) {
      return { required: { message: 'Sudoku grid is required' } };
    }

    if (!Array.isArray(grid) || grid.length !== 9) {
      return { 
        invalidSudokuGrid: { 
          message: 'Grid must be a 9x9 array' 
        } 
      };
    }

    for (let i = 0; i < 9; i++) {
      const row = grid[i];
      if (!Array.isArray(row) || row.length !== 9) {
        return {
          invalidSudokuGrid: {
            message: `Row ${i + 1} must have exactly 9 columns`
          }
        };
      }

      for (let j = 0; j < 9; j++) {
        const cell = row[j];
        if (cell !== null && cell !== 0 && (typeof cell !== 'number' || cell < 1 || cell > 9)) {
          return {
            invalidSudokuGrid: {
              message: `Invalid value at row ${i + 1}, column ${j + 1}: ${cell}`
            }
          };
        }
      }
    }

    return null;
  };
}

/**
 * Validates that a Sudoku grid follows the rules (no duplicates in rows, columns, or boxes)
 */
export function sudokuRulesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const grid: SudokuGrid = control.value;

    if (!grid) {
      return null; // Let required validator handle this
    }

    const errors: string[] = [];

    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        if (value && value > 0) {
          if (seen.has(value)) {
            errors.push(`Duplicate ${value} in row ${row + 1}`);
          }
          seen.add(value);
        }
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < 9; row++) {
        const value = grid[row][col];
        if (value && value > 0) {
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
        const seen = new Set<number>();
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            const value = grid[row][col];
            if (value && value > 0) {
              if (seen.has(value)) {
                errors.push(`Duplicate ${value} in 3x3 box (${boxRow + 1}, ${boxCol + 1})`);
              }
              seen.add(value);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return {
        sudokuRulesViolation: {
          errors,
          message: 'Sudoku rules violated'
        }
      };
    }

    return null;
  };
}

/**
 * Validates difficulty level
 */
export function difficultyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    
    if (control.value && !validDifficulties.includes(control.value)) {
      return {
        invalidDifficulty: {
          value: control.value,
          valid: validDifficulties,
          message: `Difficulty must be one of: ${validDifficulties.join(', ')}`
        }
      };
    }

    return null;
  };
}

/**
 * Validates file upload for images
 */
export function imageFileValidator(maxSize: number = 10 * 1024 * 1024): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;

    if (!file) {
      return null; // Let required validator handle this
    }

    if (!(file instanceof File)) {
      return {
        invalidFile: {
          message: 'Must be a valid file'
        }
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        fileTooLarge: {
          size: file.size,
          maxSize,
          message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
        }
      };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        invalidFileType: {
          type: file.type,
          validTypes,
          message: 'Must be an image file (JPEG, PNG, GIF, WebP)'
        }
      };
    }

    return null;
  };
}

/**
 * Cross-field validator to ensure puzzle and solution match
 */
export function puzzleSolutionMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const puzzleControl = control.get('puzzleGrid');
    const solutionControl = control.get('solutionGrid');

    if (!puzzleControl?.value || !solutionControl?.value) {
      return null;
    }

    const puzzle: SudokuGrid = puzzleControl.value;
    const solution: SudokuGrid = solutionControl.value;

    // Check that all non-empty cells in puzzle match solution
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const puzzleCell = puzzle[row][col];
        const solutionCell = solution[row][col];

        if (puzzleCell && puzzleCell > 0 && puzzleCell !== solutionCell) {
          return {
            puzzleSolutionMismatch: {
              row: row + 1,
              col: col + 1,
              puzzleValue: puzzleCell,
              solutionValue: solutionCell,
              message: `Puzzle and solution don't match at row ${row + 1}, column ${col + 1}`
            }
          };
        }
      }
    }

    return null;
  };
}

/**
 * Utility function to check if a grid has enough clues to be solvable
 */
export function hasMinimumClues(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const grid: SudokuGrid = control.value;

    if (!grid) {
      return null;
    }

    let filledCells = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] && grid[row][col]! > 0) {
          filledCells++;
        }
      }
    }

    // Minimum 17 clues needed for a unique solution
    const minClues = 17;
    if (filledCells < minClues) {
      return {
        insufficientClues: {
          current: filledCells,
          minimum: minClues,
          message: `Need at least ${minClues} clues for a solvable puzzle (current: ${filledCells})`
        }
      };
    }

    return null;
  };
}

/**
 * Get user-friendly error message from validation errors
 */
export function getValidationErrorMessage(errors: ValidationErrors): string {
  if (errors['required']) {
    return 'This field is required';
  }
  
  if (errors['invalidSudokuCell']) {
    return errors['invalidSudokuCell'].message;
  }
  
  if (errors['invalidSudokuGrid']) {
    return errors['invalidSudokuGrid'].message;
  }
  
  if (errors['sudokuRulesViolation']) {
    return errors['sudokuRulesViolation'].errors[0]; // Show first error
  }
  
  if (errors['invalidDifficulty']) {
    return errors['invalidDifficulty'].message;
  }
  
  if (errors['invalidFile']) {
    return errors['invalidFile'].message;
  }
  
  if (errors['fileTooLarge']) {
    return errors['fileTooLarge'].message;
  }
  
  if (errors['invalidFileType']) {
    return errors['invalidFileType'].message;
  }
  
  if (errors['puzzleSolutionMismatch']) {
    return errors['puzzleSolutionMismatch'].message;
  }
  
  if (errors['insufficientClues']) {
    return errors['insufficientClues'].message;
  }

  // Generic fallback
  return 'Invalid input';
}

export default {
  sudokuCellValidator,
  sudokuGridValidator,
  sudokuRulesValidator,
  difficultyValidator,
  imageFileValidator,
  puzzleSolutionMatchValidator,
  hasMinimumClues,
  getValidationErrorMessage
};
