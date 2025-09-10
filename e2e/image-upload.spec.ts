import { test, expect } from '@playwright/test';
import { MainPage } from './pages/main-page';
import path from 'path';

test.describe('Image Upload Workflow', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  test('should display image uploader correctly', async () => {
    await expect(mainPage.imageUploader).toBeVisible();
    await expect(mainPage.fileInput).toBeVisible();
  });

  test('should show file preview after selection', async () => {
    // Create a simple test image file (we'll mock this since we can't easily create real images)
    const testImagePath = path.join(__dirname, 'fixtures', 'test-sudoku.png');
    
    // Select file
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    // Check that upload button becomes enabled
    await expect(mainPage.uploadButton).toBeEnabled();
    
    // Check for preview (if implemented)
    const preview = mainPage.imageUploader.locator('img, .preview');
    if (await preview.count() > 0) {
      await expect(preview.first()).toBeVisible();
    }
  });

  test('should handle successful image upload and solving', async ({ page }) => {
    // Mock successful image solving response
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

    // Upload file
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    await mainPage.uploadButton.click();
    
    // Wait for loading to complete
    await expect(mainPage.loadingSpinner).toBeVisible();
    await expect(mainPage.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    
    // Check puzzle is loaded
    await mainPage.waitForPuzzleLoaded();
    await mainPage.expectGridNotEmpty();
    await mainPage.expectValidSudokuGrid();
    
    // Check success notification
    await mainPage.waitForNotification('success');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('solved from image');
  });

  test('should show loading state during image upload', async ({ page }) => {
    // Slow down the request to see loading state
    await page.route('**/api/sudoku/solve-from-image', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ solution: [[1, 2, 3]] }) // simplified
      });
    });

    // Upload file
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    const uploadPromise = mainPage.uploadButton.click();
    
    // Check loading state
    await expect(mainPage.loadingSpinner).toBeVisible();
    await expect(mainPage.uploadButton).toBeDisabled();
    
    // Complete upload
    await uploadPromise;
    await expect(mainPage.loadingSpinner).not.toBeVisible();
    await expect(mainPage.uploadButton).not.toBeDisabled();
  });

  test('should handle image upload errors', async ({ page }) => {
    // Mock error response
    await page.route('**/api/sudoku/solve-from-image', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Could not solve puzzle from image' })
      });
    });

    // Upload file
    await mainPage.fileInput.setInputFiles([{
      name: 'invalid-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('invalid-data')
    }]);
    
    await mainPage.uploadButton.click();
    await expect(mainPage.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    
    // Should show error message
    await expect(mainPage.errorMessage).toBeVisible();
    const errorText = await mainPage.errorMessage.textContent();
    expect(errorText).toContain('Could not solve puzzle from image');
  });

  test('should handle large file error', async ({ page }) => {
    // Mock file too large error
    await page.route('**/api/sudoku/solve-from-image', route => {
      route.fulfill({
        status: 413,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'File too large' })
      });
    });

    // Upload large file
    await mainPage.fileInput.setInputFiles([{
      name: 'large-image.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(10000000) // 10MB fake file
    }]);
    
    await mainPage.uploadButton.click();
    await expect(mainPage.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    
    // Should show file size error
    await mainPage.waitForNotification('error');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('too large');
  });

  test('should handle unsupported file types', async () => {
    // Try to upload a non-image file
    await mainPage.fileInput.setInputFiles([{
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-data')
    }]);
    
    // Upload button should still work (validation happens on server)
    await expect(mainPage.uploadButton).toBeEnabled();
  });

  test('should handle network errors during upload', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/sudoku/solve-from-image', route => {
      route.abort('failed');
    });

    // Upload file
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    await mainPage.uploadButton.click();
    await expect(mainPage.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    
    // Should show network error
    await mainPage.waitForNotification('error');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toMatch(/network|connection/i);
  });

  test('should clear file selection', async () => {
    // Select file
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    await expect(mainPage.uploadButton).toBeEnabled();
    
    // Clear selection
    await mainPage.fileInput.setInputFiles([]);
    
    // Upload button should be disabled or show appropriate message
    const uploadButton = mainPage.uploadButton;
    if (await uploadButton.isEnabled()) {
      // Click should show error about no file selected
      await uploadButton.click();
      await expect(mainPage.errorMessage).toBeVisible();
      const errorText = await mainPage.errorMessage.textContent();
      expect(errorText).toContain('select a file');
    }
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limiting response
    await page.route('**/api/sudoku/solve-from-image', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        headers: {
          'Retry-After': '60'
        }
      });
    });

    // Upload file
    await mainPage.fileInput.setInputFiles([{
      name: 'test-sudoku.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    }]);
    
    await mainPage.uploadButton.click();
    await expect(mainPage.loadingSpinner).not.toBeVisible({ timeout: 30000 });
    
    // Should show rate limit error
    await mainPage.waitForNotification('error');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toMatch(/too many requests|try again/i);
    expect(notificationText).toContain('60 seconds');
  });
});
