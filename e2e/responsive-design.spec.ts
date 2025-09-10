import { test, expect } from '@playwright/test';
import { MainPage } from './pages/main-page';

test.describe('Responsive Design', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await mainPage.goto();
    
    // Check main elements are visible
    await expect(mainPage.heading).toBeVisible();
    await expect(mainPage.easyButton).toBeVisible();
    await expect(mainPage.mediumButton).toBeVisible();
    await expect(mainPage.hardButton).toBeVisible();
    
    // Buttons should be in a row on desktop
    const controlsDiv = page.locator('.controls');
    await expect(controlsDiv).toHaveCSS('flex-direction', 'row');
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await mainPage.goto();
    
    // Check main elements are still visible
    await expect(mainPage.heading).toBeVisible();
    await expect(mainPage.easyButton).toBeVisible();
    await expect(mainPage.mediumButton).toBeVisible();
    await expect(mainPage.hardButton).toBeVisible();
    
    // Generate a puzzle and check grid is visible
    await mainPage.generatePuzzle('easy');
    await mainPage.waitForPuzzleLoaded();
    await expect(mainPage.sudokuGrid).toBeVisible();
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await mainPage.goto();
    
    // Check main elements are visible
    await expect(mainPage.heading).toBeVisible();
    await expect(mainPage.easyButton).toBeVisible();
    await expect(mainPage.mediumButton).toBeVisible();
    await expect(mainPage.hardButton).toBeVisible();
    
    // On mobile, buttons might stack vertically
    const controlsDiv = page.locator('.controls');
    const flexDirection = await controlsDiv.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    // Could be 'column' on mobile or still 'row' if using wrap
    expect(['column', 'row']).toContain(flexDirection);
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mainPage.goto();
    
    // Test touch interactions
    await mainPage.easyButton.tap();
    await mainPage.waitForPuzzleLoaded();
    
    // Grid should be touchable/interactive
    await expect(mainPage.sudokuGrid).toBeVisible();
  });

  test('should show notifications correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mainPage.goto();
    
    await mainPage.generatePuzzle('easy');
    await mainPage.waitForNotification('success');
    
    // Notification should be visible and properly positioned
    await expect(mainPage.notification).toBeVisible();
    
    // On mobile, notification might span full width
    const notificationRect = await mainPage.notification.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 375;
    
    // Notification should not exceed viewport width
    expect(notificationRect?.width).toBeLessThanOrEqual(viewportWidth);
  });

  test('should handle error messages on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mainPage.goto();
    
    // Mock an error
    await page.route('**/api/sudoku/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    await mainPage.easyButton.tap();
    await mainPage.expectErrorState();
    
    // Error message should be visible and properly formatted on mobile
    await expect(mainPage.errorMessage).toBeVisible();
    
    const errorRect = await mainPage.errorMessage.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 375;
    
    // Error message should fit within viewport
    expect(errorRect?.width).toBeLessThanOrEqual(viewportWidth);
  });

  test('should handle file upload on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mainPage.goto();
    
    // Mock successful upload
    await page.route('**/api/sudoku/solve-from-image', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          solution: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
          ]
        })
      });
    });
    
    // Upload file on mobile
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    await mainPage.uploadButton.tap();
    await mainPage.waitForPuzzleLoaded();
    
    // Grid should be properly displayed on mobile
    await expect(mainPage.sudokuGrid).toBeVisible();
  });

  test('should maintain accessibility on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await mainPage.goto();
      
      // Check focus management
      await mainPage.easyButton.focus();
      await expect(mainPage.easyButton).toBeFocused();
      
      // Check keyboard navigation
      await page.keyboard.press('Tab');
      await expect(mainPage.mediumButton).toBeFocused();
      
      // Check that all interactive elements are reachable
      const interactiveElements = [
        mainPage.easyButton,
        mainPage.mediumButton, 
        mainPage.hardButton,
        mainPage.fileInput
      ];
      
      for (const element of interactiveElements) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should handle landscape and portrait orientations on mobile', async ({ page }) => {
    // Portrait orientation
    await page.setViewportSize({ width: 375, height: 667 });
    await mainPage.goto();
    await mainPage.generatePuzzle('easy');
    await mainPage.waitForPuzzleLoaded();
    
    let gridRect = await mainPage.sudokuGrid.boundingBox();
    expect(gridRect?.width).toBeLessThanOrEqual(375);
    
    // Landscape orientation  
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Grid should still be visible and properly sized
    gridRect = await mainPage.sudokuGrid.boundingBox();
    expect(gridRect?.width).toBeLessThanOrEqual(667);
    expect(gridRect?.height).toBeLessThanOrEqual(375);
  });

  test('should handle zoom levels correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mainPage.goto();
    
    // Test different zoom levels
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = zoomLevel.toString();
      }, zoom);
      
      // Elements should still be visible and interactive
      await expect(mainPage.heading).toBeVisible();
      await expect(mainPage.easyButton).toBeVisible();
      
      // Test interaction still works
      if (zoom === 1.0) {
        await mainPage.generatePuzzle('easy');
        await mainPage.waitForPuzzleLoaded();
      }
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });
});
