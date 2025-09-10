import { test, expect } from '@playwright/test';
import { MainPage } from './pages/main-page';

test.describe('Puzzle Generation Workflow', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  test('should display main page correctly', async () => {
    await expect(mainPage.heading).toBeVisible();
    await expect(mainPage.easyButton).toBeVisible();
    await expect(mainPage.mediumButton).toBeVisible();
    await expect(mainPage.hardButton).toBeVisible();
    await expect(mainPage.imageUploader).toBeVisible();
  });

  test('should generate easy puzzle successfully', async () => {
    await mainPage.generatePuzzle('easy');
    
    // Verify puzzle is loaded
    await mainPage.waitForPuzzleLoaded();
    await mainPage.expectGridNotEmpty();
    await mainPage.expectValidSudokuGrid();
    
    // Verify success notification
    await mainPage.waitForNotification('success');
    
    // Check notification message
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('easy puzzle generated');
  });

  test('should generate medium puzzle successfully', async () => {
    await mainPage.generatePuzzle('medium');
    
    // Verify puzzle is loaded
    await mainPage.waitForPuzzleLoaded();
    await mainPage.expectGridNotEmpty();
    await mainPage.expectValidSudokuGrid();
    
    // Verify success notification
    await mainPage.waitForNotification('success');
    
    // Check notification message
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('medium puzzle generated');
  });

  test('should generate hard puzzle successfully', async () => {
    await mainPage.generatePuzzle('hard');
    
    // Verify puzzle is loaded
    await mainPage.waitForPuzzleLoaded();
    await mainPage.expectGridNotEmpty();
    await mainPage.expectValidSudokuGrid();
    
    // Verify success notification
    await mainPage.waitForNotification('success');
    
    // Check notification message
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('hard puzzle generated');
  });

  test('should show loading state during puzzle generation', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/api/sudoku/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    const generatePromise = mainPage.generatePuzzle('medium');
    
    // Check loading state appears
    await expect(mainPage.loadingSpinner).toBeVisible();
    await expect(mainPage.mediumButton).toBeDisabled();
    
    // Complete the generation
    await generatePromise;
    
    // Loading state should be gone
    await expect(mainPage.loadingSpinner).not.toBeVisible();
    await expect(mainPage.mediumButton).not.toBeDisabled();
  });

  test('should handle puzzle generation errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/sudoku/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to generate puzzle' })
      });
    });

    await mainPage.easyButton.click();
    
    // Should show error state
    await mainPage.expectErrorState();
    
    // Should show error notification
    await mainPage.waitForNotification('error');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('server error');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/sudoku/generate', route => {
      route.abort('failed');
    });

    await mainPage.easyButton.click();
    
    // Should show error state
    await mainPage.expectErrorState();
    
    // Should show network error notification
    await mainPage.waitForNotification('error');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('network');
  });

  test('should retry failed puzzle generation', async ({ page }) => {
    let requestCount = 0;
    
    // First request fails, second succeeds
    await page.route('**/api/sudoku/generate', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        route.continue();
      }
    });

    await mainPage.easyButton.click();
    
    // Should show error first
    await mainPage.expectErrorState();
    
    // Retry should work
    await mainPage.retryLastAction();
    await mainPage.waitForPuzzleLoaded();
    await mainPage.expectGridNotEmpty();
    
    expect(requestCount).toBe(2);
  });

  test('should dismiss notifications manually', async () => {
    await mainPage.generatePuzzle('easy');
    await mainPage.waitForNotification('success');
    
    // Dismiss notification
    await mainPage.dismissNotification();
    
    // Generate another puzzle
    await mainPage.generatePuzzle('medium');
    await mainPage.waitForNotification('success');
  });

  test('should generate different puzzles each time', async () => {
    // Generate first puzzle
    await mainPage.generatePuzzle('easy');
    await mainPage.waitForPuzzleLoaded();
    const firstGrid = await mainPage.getSudokuGridValues();
    
    // Generate second puzzle
    await mainPage.generatePuzzle('easy');
    await mainPage.waitForPuzzleLoaded();
    const secondGrid = await mainPage.getSudokuGridValues();
    
    // Grids should be different (very unlikely to be identical)
    const gridsAreIdentical = JSON.stringify(firstGrid) === JSON.stringify(secondGrid);
    expect(gridsAreIdentical).toBe(false);
  });
});
