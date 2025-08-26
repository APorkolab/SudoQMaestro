import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SudokuGridComponent } from './components/sudoku-grid/sudoku-grid';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader';
import { SudokuApiService, SudokuGenerationResult, SudokuGrid } from './services/sudoku-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SudokuGridComponent, ImageUploaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private sudokuService = inject(SudokuApiService);

  // State managed with Signals
  puzzleState: WritableSignal<SudokuGenerationResult | null> = signal(null);

  ngOnInit(): void {
    this.loadNewPuzzle();
  }

  loadNewPuzzle(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    this.puzzleState.set(null); // Set to null to show loading indicator
    this.sudokuService.generateSudoku(difficulty).subscribe({
      next: (data) => this.puzzleState.set(data),
      error: (err) => console.error('Failed to generate puzzle', err)
    });
  }

  onPuzzleSolvedFromImage(solutionGrid: SudokuGrid): void {
    // When an image is solved, we only have the solution.
    // We can display the solution directly, or create a new puzzle state.
    // Here, we'll display the solution as the "puzzle" and also as the solution.
    this.puzzleState.set({
      puzzle: solutionGrid,
      solution: solutionGrid
    });
  }
}
