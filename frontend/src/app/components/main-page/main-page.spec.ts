import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MainPageComponent } from './main-page';
import { SudokuApiService, SudokuGenerationResult } from '../../services/sudoku-api';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;
  let sudokuService: jasmine.SpyObj<SudokuApiService>;

  const mockPuzzleResult: SudokuGenerationResult = {
    puzzle: Array(9).fill(0).map(() => Array(9).fill(0)),
    solution: Array(9).fill(0).map(() => Array(9).fill(5))
  };

  beforeEach(async () => {
    const sudokuServiceSpy = jasmine.createSpyObj('SudokuApiService', ['generateSudoku']);

    await TestBed.configureTestingModule({
      imports: [MainPageComponent, HttpClientTestingModule],
      providers: [
        { provide: SudokuApiService, useValue: sudokuServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    sudokuService = TestBed.inject(SudokuApiService) as jasmine.SpyObj<SudokuApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load a new puzzle on init', () => {
    sudokuService.generateSudoku.and.returnValue(of(mockPuzzleResult));
    
    component.ngOnInit();
    
    expect(sudokuService.generateSudoku).toHaveBeenCalledWith('medium');
    expect(component.puzzleState()).toEqual(mockPuzzleResult);
  });

  it('should handle puzzle generation error', () => {
    const consoleSpy = spyOn(console, 'error');
    sudokuService.generateSudoku.and.returnValue(throwError('Server error'));
    
    component.ngOnInit();
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to generate puzzle', 'Server error');
    expect(component.puzzleState()).toBeNull();
  });

  it('should load new puzzle with different difficulty', () => {
    sudokuService.generateSudoku.and.returnValue(of(mockPuzzleResult));
    
    component.loadNewPuzzle('hard');
    
    expect(sudokuService.generateSudoku).toHaveBeenCalledWith('hard');
    expect(component.puzzleState()).toEqual(mockPuzzleResult);
  });

  it('should clear puzzle state when loading new puzzle', () => {
    // Set initial state
    component.puzzleState.set(mockPuzzleResult);
    expect(component.puzzleState()).toEqual(mockPuzzleResult);

    // Create a spy to track the order of calls
    const setSpy = spyOn(component.puzzleState, 'set').and.callThrough();
    sudokuService.generateSudoku.and.returnValue(of(mockPuzzleResult));
    
    component.loadNewPuzzle();
    
    // Verify it was called with null first, then the result
    expect(setSpy).toHaveBeenCalledWith(null);
    expect(setSpy).toHaveBeenCalledWith(mockPuzzleResult);
  });

  it('should handle puzzle solved from image', () => {
    const solutionGrid = Array(9).fill(0).map(() => Array(9).fill(7));
    
    component.onPuzzleSolvedFromImage(solutionGrid);
    
    const expectedResult = {
      puzzle: solutionGrid,
      solution: solutionGrid,
      difficulty: 'custom' as const
    };
    expect(component.puzzleState()).toEqual(expectedResult);
  });

  it('should reset puzzle state before generating new one', () => {
    // Set initial state
    component.puzzleState.set(mockPuzzleResult);
    
    sudokuService.generateSudoku.and.returnValue(of(mockPuzzleResult));
    
    // Spy on the signal set method to verify it's called with null first
    spyOn(component.puzzleState, 'set').and.callThrough();
    
    component.loadNewPuzzle('easy');
    
    // Verify null was set first (clearing state)
    expect(component.puzzleState.set).toHaveBeenCalledWith(null);
    expect(component.puzzleState.set).toHaveBeenCalledWith(mockPuzzleResult);
  });
});
