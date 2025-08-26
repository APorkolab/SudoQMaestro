import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SudokuGridComponent } from './sudoku-grid';
import { By } from '@angular/platform-browser';

describe('SudokuGridComponent', () => {
  let component: SudokuGridComponent;
  let fixture: ComponentFixture<SudokuGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SudokuGridComponent] // It's a standalone component
    })
    .compileComponents();

    fixture = TestBed.createComponent(SudokuGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render 81 cells for a 9x9 grid', () => {
    // A simple 9x9 grid filled with 0s
    component.grid = Array(9).fill(0).map(() => Array(9).fill(0));
    fixture.detectChanges();

    const cells = fixture.debugElement.queryAll(By.css('.sudoku-cell'));
    expect(cells.length).toBe(81);
  });

  it('should display the correct numbers in the input fields', () => {
    const testGrid = Array(9).fill(0).map(() => Array(9).fill(0));
    testGrid[0][0] = 5;
    testGrid[8][8] = 9;

    component.grid = testGrid;
    fixture.detectChanges();

    const inputElements = fixture.debugElement.queryAll(By.css('.cell-input'));
    const firstInput = inputElements[0].nativeElement as HTMLInputElement;
    const lastInput = inputElements[80].nativeElement as HTMLInputElement;

    expect(firstInput.value).toBe('5');
    expect(lastInput.value).toBe('9');
  });

  it('should show the loading message if grid is null', () => {
    component.grid = null;
    fixture.detectChanges();

    const loadingElement = fixture.debugElement.query(By.css('.loading-grid'));
    const boardElement = fixture.debugElement.query(By.css('.sudoku-board'));

    expect(loadingElement).toBeTruthy();
    expect(boardElement).toBeFalsy();
  });
});
