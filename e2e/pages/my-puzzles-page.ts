import { Page, Locator, expect } from '@playwright/test';

export class MyPuzzlesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly puzzleList: Locator;
  readonly emptyMessage: Locator;
  readonly newPuzzleLink: Locator;
  readonly difficultyFilter: Locator;
  readonly sortDropdown: Locator;
  readonly searchInput: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /my puzzles/i });
    this.puzzleList = page.locator('[data-testid="puzzle-list"]');
    this.emptyMessage = page.locator('[data-testid="empty-puzzles"]');
    this.newPuzzleLink = page.getByRole('link', { name: /new puzzle|start solving/i });
    this.difficultyFilter = page.locator('[data-testid="difficulty-filter"]');
    this.sortDropdown = page.locator('select[name="sort"]');
    this.searchInput = page.locator('input[name="search"]');
    this.loadingSpinner = page.locator('.loading-spinner');
  }

  async goto() {
    await this.page.goto('/my-puzzles');
    await expect(this.heading).toBeVisible();
  }

  async waitForPuzzlesLoad() {
    // Wait for loading to complete
    await expect(this.loadingSpinner).not.toBeVisible();
    
    // Either puzzle list or empty message should be visible
    const puzzlesVisible = await this.puzzleList.isVisible();
    const emptyVisible = await this.emptyMessage.isVisible();
    expect(puzzlesVisible || emptyVisible).toBeTruthy();
  }

  async expectEmptyState() {
    await expect(this.emptyMessage).toBeVisible();
    await expect(this.newPuzzleLink).toBeVisible();
  }

  async expectPuzzleCount(count: number) {
    const puzzleItems = this.puzzleList.locator('.puzzle-item');
    await expect(puzzleItems).toHaveCount(count);
  }

  async expectPuzzleVisible(title: string) {
    const puzzle = this.getPuzzleByTitle(title);
    await expect(puzzle).toBeVisible();
  }

  async expectPuzzleNotVisible(title: string) {
    const puzzle = this.getPuzzleByTitle(title);
    await expect(puzzle).not.toBeVisible();
  }

  getPuzzleByTitle(title: string): Locator {
    return this.puzzleList.locator('.puzzle-item').filter({ hasText: title });
  }

  async getPuzzleProgress(title: string): Promise<string> {
    const puzzle = this.getPuzzleByTitle(title);
    const progressElement = puzzle.locator('[data-testid="puzzle-progress"]');
    return await progressElement.textContent() || '';
  }

  async getPuzzleDifficulty(title: string): Promise<string> {
    const puzzle = this.getPuzzleByTitle(title);
    const difficultyBadge = puzzle.locator('[data-testid="puzzle-difficulty"]');
    return await difficultyBadge.textContent() || '';
  }

  async resumePuzzle(title: string) {
    const puzzle = this.getPuzzleByTitle(title);
    const resumeButton = puzzle.getByRole('button', { name: /resume|continue/i });
    await resumeButton.click();
  }

  async deletePuzzle(title: string) {
    const puzzle = this.getPuzzleByTitle(title);
    const deleteButton = puzzle.getByRole('button', { name: /delete|remove/i });
    await deleteButton.click();
    
    // Handle confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    await confirmButton.click();
  }

  async filterByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'all') {
    const filterButton = this.difficultyFilter.getByRole('button', { name: new RegExp(difficulty, 'i') });
    await filterButton.click();
  }

  async sortBy(criteria: 'progress' | 'lastPlayed' | 'created' | 'title') {
    await this.sortDropdown.selectOption(criteria);
  }

  async searchPuzzles(query: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(query);
    // Wait for debounced search
    await this.page.waitForTimeout(500);
  }

  async expectPuzzleOrder(titles: string[]) {
    const puzzleItems = this.puzzleList.locator('.puzzle-item');
    
    for (let i = 0; i < titles.length; i++) {
      const nthPuzzle = puzzleItems.nth(i);
      await expect(nthPuzzle).toContainText(titles[i]);
    }
  }

  async expectDifficultyBadges(puzzleTitle: string, difficulty: 'easy' | 'medium' | 'hard') {
    const puzzle = this.getPuzzleByTitle(puzzleTitle);
    const difficultyBadge = puzzle.locator(`.difficulty-${difficulty}`);
    await expect(difficultyBadge).toBeVisible();
  }

  async expectProgressIndicator(puzzleTitle: string, progress: number) {
    const puzzle = this.getPuzzleByTitle(puzzleTitle);
    const progressText = puzzle.locator('[data-testid="puzzle-progress"]');
    await expect(progressText).toContainText(`${progress}%`);
    
    // Also check progress bar if it exists
    const progressBar = puzzle.locator('[data-testid="progress-bar"]');
    if (await progressBar.isVisible()) {
      const progressValue = await progressBar.getAttribute('value');
      expect(parseInt(progressValue || '0')).toBe(progress);
    }
  }

  async expectCompletedStatus(puzzleTitle: string) {
    const puzzle = this.getPuzzleByTitle(puzzleTitle);
    const completedIndicator = puzzle.locator('[data-testid="completed-indicator"]');
    await expect(completedIndicator).toBeVisible();
    await expect(completedIndicator).toContainText(/completed/i);
  }

  async expectDateInfo(puzzleTitle: string, dateType: 'created' | 'lastPlayed' | 'completed') {
    const puzzle = this.getPuzzleByTitle(puzzleTitle);
    const dateElement = puzzle.locator(`[data-testid="${dateType}-date"]`);
    await expect(dateElement).toBeVisible();
    
    // Check that date is formatted correctly (basic validation)
    const dateText = await dateElement.textContent();
    expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d+ \w+ ago|today|yesterday/i);
  }

  async clickNewPuzzleLink() {
    await this.newPuzzleLink.click();
    // Should navigate back to main page
    await expect(this.page).toHaveURL(/.*\/$/);
  }

  async expectPaginationControls(totalPages: number) {
    if (totalPages > 1) {
      const pagination = this.page.locator('[data-testid="pagination"]');
      await expect(pagination).toBeVisible();
      
      const pageButtons = pagination.locator('button');
      const visiblePageCount = await pageButtons.count();
      expect(visiblePageCount).toBeGreaterThan(0);
    }
  }

  async goToPage(pageNumber: number) {
    const pagination = this.page.locator('[data-testid="pagination"]');
    const pageButton = pagination.getByRole('button', { name: pageNumber.toString() });
    await pageButton.click();
    await this.waitForPuzzlesLoad();
  }
}
