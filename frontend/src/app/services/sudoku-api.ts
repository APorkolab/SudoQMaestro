import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Type Definitions
export type SudokuGrid = (number | null)[][];

export interface SudokuGenerationResult {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  difficulty?: 'easy' | 'medium' | 'hard' | 'custom';
}

@Injectable({
  providedIn: 'root'
})
export class SudokuApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/sudoku'; // Adjust if your backend URL is different

  /**
   * Fetches a new Sudoku puzzle from the backend.
   * @param difficulty The desired difficulty of the puzzle.
   * @returns An Observable of the generated puzzle and its solution.
   */
  generateSudoku(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Observable<SudokuGenerationResult> {
    return this.http.get<SudokuGenerationResult>(`${this.apiUrl}/generate`, {
      params: { difficulty }
    });
  }

  /**
   * Sends a puzzle to the backend to be solved.
   * @param grid The Sudoku grid to solve.
   * @returns An Observable of the solution.
   */
  solveSudoku(grid: SudokuGrid): Observable<{ solution: SudokuGrid }> {
    return this.http.post<{ solution: SudokuGrid }>(`${this.apiUrl}/solve`, { grid });
  }

  /**
   * Uploads an image to the backend to be solved.
   * @param file The image file to upload.
   * @returns An Observable of the solution.
   */
  solveFromImage(file: File): Observable<{ solution: SudokuGrid }> {
    const formData = new FormData();
    formData.append('sudokuImage', file, file.name);

    return this.http.post<{ solution: SudokuGrid }>(`${this.apiUrl}/solve-from-image`, formData);
  }
}
