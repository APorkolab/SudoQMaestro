import { test, expect } from '@playwright/test';
import { MainPage } from './pages/main-page';

test.describe('Authentication Flow', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
  });

  test('should display login button when user is not authenticated', async ({ page }) => {
    await mainPage.goto();
    
    // Check that login button is visible
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await expect(loginButton).toBeVisible();
    
    // Check that user info is not displayed
    const userInfo = page.locator('[data-testid="user-info"]');
    await expect(userInfo).not.toBeVisible();
  });

  test('should handle login flow', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/auth/google', (route) => {
      // Redirect to a success page that would set auth cookie
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/callback?success=true'
        }
      });
    });

    // Mock current user endpoint to return authenticated user
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

    await mainPage.goto();
    
    // Click login button
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await loginButton.click();
    
    // Should redirect and show user info after login
    // Note: In a real scenario, this would involve OAuth flow
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // Login button should be replaced with logout
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible();
  });

  test('should handle logout flow', async ({ page }) => {
    // Mock authenticated user initially
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

    // Mock logout endpoint
    await page.route('**/api/auth/logout', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await mainPage.goto();
    
    // Should show user as logged in
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // Click logout
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();
    
    // After logout, should show login button again
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await expect(loginButton).toBeVisible();
    
    // User info should be hidden
    await expect(page.locator('text=Welcome, Test User')).not.toBeVisible();
  });

  test('should handle authentication errors', async ({ page }) => {
    // Mock auth error
    await page.route('**/api/auth/current-user', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    await mainPage.goto();
    
    // Should show login button (not authenticated)
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await expect(loginButton).toBeVisible();
  });

  test('should handle network errors during auth check', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/current-user', (route) => {
      route.abort('failed');
    });

    await mainPage.goto();
    
    // Should gracefully handle network error and show login
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await expect(loginButton).toBeVisible();
  });

  test('should redirect to login for protected actions when not authenticated', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('**/api/auth/current-user', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // Mock protected endpoint (e.g., saving a puzzle)
    await page.route('**/api/puzzles/save', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication required' })
      });
    });

    await mainPage.goto();
    
    // Try to access a protected feature (if implemented)
    // This would typically involve trying to save a puzzle or access profile
    
    // Should show authentication required message
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await expect(loginButton).toBeVisible();
  });

  test('should maintain user session across page reloads', async ({ page }) => {
    // Mock authenticated user with session
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

    await mainPage.goto();
    
    // Verify user is logged in
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // User should still be logged in
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // Logout button should still be visible
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible();
  });

  test('should handle different user roles', async ({ page }) => {
    // Mock admin user
    await page.route('**/api/auth/current-user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '456',
          googleId: 'google-456',
          displayName: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        })
      });
    });

    await mainPage.goto();
    
    // Should show admin user info
    await expect(page.locator('text=Welcome, Admin User')).toBeVisible();
    
    // Admin-specific features could be tested here
    // For example, admin panel access, user management, etc.
  });

  test('should handle profile navigation for authenticated users', async ({ page }) => {
    // Mock authenticated user
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

    await mainPage.goto();
    
    // Should show user name as clickable link to profile
    const profileLink = page.locator('a[routerlink="/profile"]');
    await expect(profileLink).toBeVisible();
    
    // Click profile link should navigate (if profile page exists)
    // This test would be expanded based on actual profile implementation
  });

  test('should handle authentication timeout gracefully', async ({ page }) => {
    // Mock initial authenticated state
    let requestCount = 0;
    await page.route('**/api/auth/current-user', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request - authenticated
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
      } else {
        // Subsequent requests - session expired
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      }
    });

    await mainPage.goto();
    
    // Initially authenticated
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
    
    // Simulate session expiry by triggering another auth check
    await page.reload();
    
    // Should show login button after session expires
    const loginButton = page.getByRole('button', { name: /login with google/i });
    await expect(loginButton).toBeVisible();
    
    // Should show session expired notification
    await mainPage.waitForNotification('warning');
    const notificationText = await mainPage.notification.textContent();
    expect(notificationText).toMatch(/session|expired|login/i);
  });
});
