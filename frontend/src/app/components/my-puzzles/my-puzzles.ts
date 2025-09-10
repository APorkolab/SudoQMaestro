import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SudokuGridComponent } from '../sudoku-grid/sudoku-grid';
import { SudokuApiService, SudokuGrid } from '../../services/sudoku-api';
import { AuthService } from '../../services/auth.service';

export interface SavedPuzzle {
  _id: string;
  puzzleGrid: SudokuGrid;
  solutionGrid: SudokuGrid;
  difficulty: string;
  createdAt: Date;
}

@Component({
  selector: 'app-my-puzzles',
  standalone: true,
  imports: [CommonModule, SudokuGridComponent],
  template: `
    <div class="my-puzzles-container">
      <h2>My Saved Puzzles</h2>
      
      @if (isLoading) {
        <div class="loading">Loading puzzles...</div>
      }
      
      @if (error) {
        <div class="error">{{ error }}</div>
      }
      
      @if (!isLoading && puzzles.length === 0) {
        <div class="empty-state">
          <p>No saved puzzles yet.</p>
          <button (click)="goToMainPage()">Create your first puzzle</button>
        </div>
      }
      
      <div class="puzzles-grid">
        @for (puzzle of puzzles; track puzzle._id) {
          <div class="puzzle-card">
            <div class="puzzle-info">
              <h3>Difficulty: {{ puzzle.difficulty }}</h3>
              <p>Created: {{ puzzle.createdAt | date:'short' }}</p>
            </div>
            <app-sudoku-grid 
              [grid]="puzzle.puzzleGrid"
              [readonly]="true">
            </app-sudoku-grid>
            <div class="puzzle-actions">
              <button (click)="loadPuzzle(puzzle)">Load</button>
              <button (click)="deletePuzzle(puzzle._id)" class="danger">Delete</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .my-puzzles-container {
      padding: 20px;
    }
    
    .puzzles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .puzzle-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      background: white;
    }
    
    .puzzle-info h3 {
      margin: 0 0 8px 0;
      color: #333;
    }
    
    .puzzle-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .puzzle-actions button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
      cursor: pointer;
    }
    
    .puzzle-actions button.danger {
      background: #dc3545;
      color: white;
      border-color: #dc3545;
    }
    
    .loading, .error, .empty-state {
      text-align: center;
      padding: 40px;
    }
    
    .error {
      color: #dc3545;
    }
  `]
})
export class MyPuzzlesComponent implements OnInit {
  private sudokuService = inject(SudokuApiService);
  private authService = inject(AuthService);
  
  puzzles: SavedPuzzle[] = [];
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadPuzzles();
  }

  loadPuzzles(): void {
    this.isLoading = true;
    this.error = null;
    
    // For now, we'll just set empty puzzles since the API endpoint doesn't exist yet
    // In a real implementation, you would call an API endpoint like:
    // this.sudokuService.getMyPuzzles().subscribe({...})
    
    setTimeout(() => {
      this.puzzles = [];
      this.isLoading = false;
    }, 1000);
  }

  loadPuzzle(puzzle: SavedPuzzle): void {
    console.log('Loading puzzle:', puzzle);
    // Navigate to main page with loaded puzzle
  }

  deletePuzzle(puzzleId: string): void {
    if (confirm('Are you sure you want to delete this puzzle?')) {
      // API call to delete puzzle
      this.puzzles = this.puzzles.filter(p => p._id !== puzzleId);
    }
  }

  goToMainPage(): void {
    // Navigate to main page
    window.location.href = '/';
  }
}
