import { Page, Locator, expect } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly displayNameField: Locator;
  readonly emailField: Locator;
  readonly editButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly displayNameInput: Locator;
  readonly statsSection: Locator;
  readonly totalPuzzles: Locator;
  readonly averageTime: Locator;
  readonly totalPlayTime: Locator;
  readonly longestStreak: Locator;
  readonly easyCount: Locator;
  readonly mediumCount: Locator;
  readonly hardCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /profile/i });
    this.displayNameField = page.locator('[data-testid="display-name"]');
    this.emailField = page.locator('[data-testid="email"]');
    this.editButton = page.getByRole('button', { name: /edit/i });
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.displayNameInput = page.locator('input[name="displayName"]');
    
    // Statistics section
    this.statsSection = page.locator('[data-testid="user-stats"]');
    this.totalPuzzles = page.locator('[data-testid="total-puzzles"]');
    this.averageTime = page.locator('[data-testid="average-time"]');
    this.totalPlayTime = page.locator('[data-testid="total-play-time"]');
    this.longestStreak = page.locator('[data-testid="longest-streak"]');
    this.easyCount = page.locator('[data-testid="easy-count"]');
    this.mediumCount = page.locator('[data-testid="medium-count"]');
    this.hardCount = page.locator('[data-testid="hard-count"]');
  }

  async goto() {
    await this.page.goto('/profile');
    await expect(this.heading).toBeVisible();
  }

  async expectUserInfo(displayName: string, email: string) {
    await expect(this.displayNameField).toContainText(displayName);
    await expect(this.emailField).toContainText(email);
  }

  async expectStats(stats: {
    totalPuzzles: number;
    averageTime: string;
    totalPlayTime: string;
    longestStreak: number;
    difficulties: {
      easy: number;
      medium: number;
      hard: number;
    };
  }) {
    await expect(this.totalPuzzles).toContainText(stats.totalPuzzles.toString());
    await expect(this.averageTime).toContainText(stats.averageTime);
    await expect(this.totalPlayTime).toContainText(stats.totalPlayTime);
    await expect(this.longestStreak).toContainText(stats.longestStreak.toString());
    await expect(this.easyCount).toContainText(stats.difficulties.easy.toString());
    await expect(this.mediumCount).toContainText(stats.difficulties.medium.toString());
    await expect(this.hardCount).toContainText(stats.difficulties.hard.toString());
  }

  async editDisplayName(newName: string) {
    await this.editButton.click();
    await expect(this.displayNameInput).toBeVisible();
    await this.displayNameInput.clear();
    await this.displayNameInput.fill(newName);
    await this.saveButton.click();
  }

  async cancelEdit() {
    await this.cancelButton.click();
    await expect(this.displayNameInput).not.toBeVisible();
  }

  async expectInEditMode() {
    await expect(this.displayNameInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async expectInViewMode() {
    await expect(this.displayNameInput).not.toBeVisible();
    await expect(this.editButton).toBeVisible();
  }
}
