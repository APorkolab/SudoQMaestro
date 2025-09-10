import { Page, Locator, expect } from '@playwright/test';

export class MainPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly easyButton: Locator;
  readonly mediumButton: Locator;
  readonly hardButton: Locator;
  readonly sudokuGrid: Locator;
  readonly imageUploader: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly notification: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /sudoqmaestro/i });
    this.easyButton = page.getByRole('button', { name: /new easy game/i });
    this.mediumButton = page.getByRole('button', { name: /new medium game/i });
    this.hardButton = page.getByRole('button', { name: /new hard game/i });
    this.sudokuGrid = page.locator('app-sudoku-grid');
    this.imageUploader = page.locator('app-image-uploader');
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page.getByRole('button', { name: /upload/i });
    this.loadingSpinner = page.locator('.loading-spinner');
    this.errorMessage = page.locator('.error-message');
    this.notification = page.locator('app-notification');
    this.retryButton = page.getByRole('button', { name: /retry/i });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.heading).toBeVisible();
  }

  async generatePuzzle(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    const button = difficulty === 'easy' ? this.easyButton : 
                   difficulty === 'hard' ? this.hardButton : this.mediumButton;
    
    await button.click();
    
    // Wait for loading to complete
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 30000 });
  }

  async uploadImage(imagePath: string) {
    await this.fileInput.setInputFiles(imagePath);
    await this.uploadButton.click();
    
    // Wait for upload to complete
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 30000 });
  }

  async waitForPuzzleLoaded() {
    await expect(this.sudokuGrid).toBeVisible();
    // Check that the grid has actual content (not empty)
    await expect(this.sudokuGrid.locator('td').first()).toBeVisible();
  }

  async waitForNotification(type: 'success' | 'error' | 'warning' | 'info') {
    await expect(this.notification).toBeVisible();
    await expect(this.notification.locator(`.notification--${type}`)).toBeVisible();
  }

  async dismissNotification() {
    const closeButton = this.notification.locator('.notification__close');
    await closeButton.click();
    await expect(this.notification).not.toBeVisible();
  }

  async expectErrorState() {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.retryButton).toBeVisible();
  }

  async retryLastAction() {
    await this.retryButton.click();
  }

  async getSudokuGridValues(): Promise<(number | null)[][]> {
    // Get all cell values from the Sudoku grid
    const cells = await this.sudokuGrid.locator('td').all();
    const grid: (number | null)[][] = [];
    
    for (let i = 0; i < 9; i++) {
      const row: (number | null)[] = [];
      for (let j = 0; j < 9; j++) {
        const cellIndex = i * 9 + j;
        const cellText = await cells[cellIndex].textContent();
        const value = cellText && cellText.trim() ? parseInt(cellText.trim()) : null;
        row.push(value);
      }
      grid.push(row);
    }
    
    return grid;
  }

  async expectGridNotEmpty() {
    const grid = await this.getSudokuGridValues();
    const hasValues = grid.some(row => row.some(cell => cell !== null));
    expect(hasValues).toBeTruthy();
  }

  async expectValidSudokuGrid() {
    const grid = await this.getSudokuGridValues();
    
    // Check that it's a 9x9 grid
    expect(grid.length).toBe(9);
    grid.forEach(row => {
      expect(row.length).toBe(9);
    });
    
    // Check that all values are between 0-9
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell !== null) {
          expect(cell).toBeGreaterThanOrEqual(1);
          expect(cell).toBeLessThanOrEqual(9);
        }
      });
    });
  }
}
