import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SudokuGrid } from '../../services/sudoku-api';

@Component({
  selector: 'app-sudoku-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sudoku-grid.html',
  styleUrl: './sudoku-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SudokuGridComponent {
  @Input() grid: SudokuGrid | null = null;
  @Input() readonly: boolean = false;

  // TrackBy function to optimize grid rendering
  trackByIndex(index: number): number {
    return index;
  }
  
  // Alias for template use
  trackByFn = this.trackByIndex;
}
