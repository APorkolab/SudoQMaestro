import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SudokuGridComponent } from '../sudoku-grid/sudoku-grid';
import { ImageUploaderComponent } from '../image-uploader/image-uploader';
import { SudokuApiService, SudokuGenerationResult, SudokuGrid } from '../../services/sudoku-api';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, SudokuGridComponent, ImageUploaderComponent],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPageComponent implements OnInit {
  private sudokuService = inject(SudokuApiService);

  puzzleState: WritableSignal<SudokuGenerationResult | null> = signal(null);

  ngOnInit(): void {
    this.loadNewPuzzle();
  }

  loadNewPuzzle(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    this.puzzleState.set(null);
    this.sudokuService.generateSudoku(difficulty).subscribe({
      next: (data) => this.puzzleState.set(data),
      error: (err) => console.error('Failed to generate puzzle', err)
    });
  }

  onPuzzleSolvedFromImage(solutionGrid: SudokuGrid): void {
    this.puzzleState.set({
      puzzle: solutionGrid,
      solution: solutionGrid,
      difficulty: 'custom'
    });
  }
}
