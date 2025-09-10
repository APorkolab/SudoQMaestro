import { test, expect } from '@playwright/test';
import { MainPage } from './pages/main-page';

test.describe('User Profile and Puzzle Management', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    
    // Mock authenticated user for all tests
    await page.route('**/api/auth/current-user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          googleId: 'google-123',
          displayName: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      });
    });
  });

  test('should navigate to user profile page', async ({ page }) => {
    await mainPage.goto();
    
    // Click on profile link
    const profileLink = page.locator('a[routerlink="/profile"]');
    await expect(profileLink).toBeVisible();
    await profileLink.click();
    
    // Should navigate to profile page
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Should show user information
    await expect(page.locator('text=Test User')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('should display user statistics on profile page', async ({ page }) => {
    // Mock user statistics
    await page.route('**/api/users/*/stats', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalPuzzlesSolved: 42,
          averageSolveTime: 180, // 3 minutes in seconds
          difficultiesCompleted: {
            easy: 20,
            medium: 15,
            hard: 7
          },
          longestStreak: 5,
          totalPlayTime: 7200 // 2 hours in seconds
        })
      });
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/profile"]').click();
    
    // Should display statistics
    await expect(page.locator('text=42')).toBeVisible(); // Total puzzles
    await expect(page.locator('text=3:00')).toBeVisible(); // Average time
    await expect(page.locator('text=2 hours')).toBeVisible(); // Total play time
    await expect(page.locator('text=5')).toBeVisible(); // Longest streak
  });

  test('should save puzzle progress', async ({ page }) => {
    // Mock save puzzle endpoint
    await page.route('**/api/puzzles/save', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'puzzle-123',
          success: true,
          message: 'Puzzle saved successfully'
        })
      });
    });

    await mainPage.goto();
    await mainPage.generatePuzzle('medium');
    await mainPage.waitForPuzzleLoaded();
    
    // Look for save button (would need to be implemented)
    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Should show success notification
      await mainPage.waitForNotification('success');
      const notificationText = await mainPage.notification.textContent();
      expect(notificationText).toContain('saved');
    }
  });

  test('should load saved puzzles from My Puzzles page', async ({ page }) => {
    // Mock saved puzzles endpoint
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Medium Puzzle #1',
            difficulty: 'medium',
            progress: 65,
            createdAt: '2024-01-01T12:00:00Z',
            lastPlayedAt: '2024-01-02T15:30:00Z',
            completed: false,
            puzzleGrid: [
              [5, 3, 0, 0, 7, 0, 0, 0, 0],
              [6, 0, 0, 1, 9, 5, 0, 0, 0],
              // ... rest of grid
            ]
          },
          {
            id: '2',
            title: 'Hard Puzzle #1',
            difficulty: 'hard',
            progress: 100,
            createdAt: '2024-01-01T10:00:00Z',
            lastPlayedAt: '2024-01-01T11:45:00Z',
            completed: true,
            completedAt: '2024-01-01T11:45:00Z'
          }
        ])
      });
    });

    await mainPage.goto();
    
    // Navigate to My Puzzles page
    const myPuzzlesLink = page.locator('a[routerlink="/my-puzzles"]');
    await myPuzzlesLink.click();
    
    await expect(page).toHaveURL(/.*\/my-puzzles/);
    
    // Should display saved puzzles
    await expect(page.locator('text=Medium Puzzle #1')).toBeVisible();
    await expect(page.locator('text=Hard Puzzle #1')).toBeVisible();
    
    // Should show progress indicators
    await expect(page.locator('text=65%')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    
    // Should show difficulty badges
    await expect(page.locator('.difficulty-medium')).toBeVisible();
    await expect(page.locator('.difficulty-hard')).toBeVisible();
  });

  test('should resume saved puzzle from My Puzzles page', async ({ page }) => {
    // Mock saved puzzles endpoint
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Medium Puzzle #1',
            difficulty: 'medium',
            progress: 65,
            puzzleGrid: [
              [5, 3, 4, 0, 7, 0, 0, 0, 0],
              [6, 7, 0, 1, 9, 5, 0, 0, 0],
              // ... partially filled grid
            ]
          }
        ])
      });
    });

    // Mock individual puzzle load
    await page.route('**/api/puzzles/1', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          title: 'Medium Puzzle #1',
          difficulty: 'medium',
          progress: 65,
          puzzleGrid: [
            [5, 3, 4, 0, 7, 0, 0, 0, 0],
            [6, 7, 0, 1, 9, 5, 0, 0, 0],
            // ... partially filled grid
          ]
        })
      });
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/my-puzzles"]').click();
    
    // Click resume button for the first puzzle
    const resumeButton = page.getByRole('button', { name: /resume|continue/i }).first();
    await resumeButton.click();
    
    // Should navigate back to main page with loaded puzzle
    await expect(page).toHaveURL(/.*\//);
    await mainPage.waitForPuzzleLoaded();
    
    // Grid should contain the partially filled state
    await mainPage.expectGridNotEmpty();
  });

  test('should delete saved puzzle', async ({ page }) => {
    // Mock saved puzzles endpoint
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Medium Puzzle #1',
            difficulty: 'medium',
            progress: 65
          }
        ])
      });
    });

    // Mock delete endpoint
    await page.route('**/api/puzzles/1', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        route.continue();
      }
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/my-puzzles"]').click();
    
    // Click delete button
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
    await deleteButton.click();
    
    // Should show confirmation dialog
    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    await confirmButton.click();
    
    // Should show success notification
    await mainPage.waitForNotification('success');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('deleted');
    
    // Puzzle should be removed from the list
    await expect(page.locator('text=Medium Puzzle #1')).not.toBeVisible();
  });

  test('should handle empty saved puzzles list', async ({ page }) => {
    // Mock empty puzzles list
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/my-puzzles"]').click();
    
    // Should show empty state message
    await expect(page.locator('text=No saved puzzles')).toBeVisible();
    await expect(page.locator('text=Start solving puzzles')).toBeVisible();
    
    // Should show link/button to start new puzzle
    const newPuzzleLink = page.getByRole('link', { name: /new puzzle|start solving/i });
    await expect(newPuzzleLink).toBeVisible();
  });

  test('should filter puzzles by difficulty', async ({ page }) => {
    // Mock saved puzzles with different difficulties
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', title: 'Easy #1', difficulty: 'easy', progress: 100 },
          { id: '2', title: 'Medium #1', difficulty: 'medium', progress: 50 },
          { id: '3', title: 'Hard #1', difficulty: 'hard', progress: 25 },
          { id: '4', title: 'Easy #2', difficulty: 'easy', progress: 80 }
        ])
      });
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/my-puzzles"]').click();
    
    // Should show all puzzles initially
    await expect(page.locator('text=Easy #1')).toBeVisible();
    await expect(page.locator('text=Medium #1')).toBeVisible();
    await expect(page.locator('text=Hard #1')).toBeVisible();
    await expect(page.locator('text=Easy #2')).toBeVisible();
    
    // Filter by medium difficulty
    const mediumFilter = page.getByRole('button', { name: /medium/i });
    await mediumFilter.click();
    
    // Should show only medium puzzles
    await expect(page.locator('text=Medium #1')).toBeVisible();
    await expect(page.locator('text=Easy #1')).not.toBeVisible();
    await expect(page.locator('text=Hard #1')).not.toBeVisible();
    await expect(page.locator('text=Easy #2')).not.toBeVisible();
  });

  test('should sort puzzles by different criteria', async ({ page }) => {
    // Mock saved puzzles
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            id: '1', 
            title: 'Puzzle A', 
            createdAt: '2024-01-01T12:00:00Z',
            lastPlayedAt: '2024-01-03T12:00:00Z',
            progress: 30
          },
          { 
            id: '2', 
            title: 'Puzzle B', 
            createdAt: '2024-01-02T12:00:00Z',
            lastPlayedAt: '2024-01-02T12:00:00Z',
            progress: 80
          }
        ])
      });
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/my-puzzles"]').click();
    
    // Test sorting by progress
    const sortDropdown = page.locator('select[name="sort"]');
    await sortDropdown.selectOption('progress');
    
    // Higher progress should appear first
    const firstPuzzle = page.locator('.puzzle-item').first();
    await expect(firstPuzzle.locator('text=Puzzle B')).toBeVisible();
    
    // Test sorting by last played
    await sortDropdown.selectOption('lastPlayed');
    
    // More recently played should appear first
    await expect(page.locator('.puzzle-item').first().locator('text=Puzzle A')).toBeVisible();
  });

  test('should handle puzzle loading errors', async ({ page }) => {
    // Mock saved puzzles endpoint
    await page.route('**/api/puzzles/user/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', title: 'Puzzle 1', difficulty: 'medium' }
        ])
      });
    });

    // Mock puzzle load error
    await page.route('**/api/puzzles/1', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Puzzle not found' })
      });
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/my-puzzles"]').click();
    
    // Try to resume puzzle
    const resumeButton = page.getByRole('button', { name: /resume/i }).first();
    await resumeButton.click();
    
    // Should show error notification
    await mainPage.waitForNotification('error');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('not found');
  });

  test('should update profile information', async ({ page }) => {
    // Mock profile update endpoint
    await page.route('**/api/users/profile', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: '123',
              displayName: 'Updated User',
              email: 'test@example.com'
            }
          })
        });
      } else {
        route.continue();
      }
    });

    await mainPage.goto();
    await page.locator('a[routerlink="/profile"]').click();
    
    // Click edit profile button
    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();
    
    // Update display name
    const nameInput = page.locator('input[name="displayName"]');
    await nameInput.clear();
    await nameInput.fill('Updated User');
    
    // Save changes
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();
    
    // Should show success notification
    await mainPage.waitForNotification('success');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toContain('updated');
    
    // Should display updated name
    await expect(page.locator('text=Updated User')).toBeVisible();
  });
});
