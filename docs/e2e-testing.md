# End-to-End Testing Guide

This document describes the comprehensive E2E testing setup for the SudoQMaestro application using Playwright.

## Overview

The E2E testing suite covers complete user workflows including:
- Puzzle generation and solving
- Image upload and processing
- Error handling and recovery
- Responsive design and mobile compatibility
- Authentication and authorization flows
- Admin functionality

## Test Structure

### Test Organization

```
e2e/
├── global-setup.ts          # Global test setup and data seeding
├── global-teardown.ts       # Global test cleanup
├── pages/                   # Page Object Model
│   ├── main-page.ts        # Main puzzle page interactions
│   ├── auth-page.ts        # Authentication page (future)
│   └── admin-page.ts       # Admin page (future)
├── fixtures/               # Test data and assets
│   └── test-sudoku.png     # Sample Sudoku images
├── puzzle-generation.spec.ts    # Puzzle generation tests
├── image-upload.spec.ts        # Image upload workflow tests
├── responsive-design.spec.ts   # Mobile and responsive tests
└── auth-flow.spec.ts          # Authentication tests (future)
```

### Page Object Model

The tests use the Page Object Model pattern for maintainable and reusable test code:

- **MainPage**: Encapsulates main page interactions and verifications
- **AuthPage**: Handles authentication workflows (to be implemented)
- **AdminPage**: Manages admin functionality testing (to be implemented)

## Test Scenarios

### 1. Puzzle Generation Workflow (`puzzle-generation.spec.ts`)

**Happy Path Tests:**
- Generate easy, medium, and hard puzzles successfully
- Verify puzzle grid structure and validity
- Check success notifications

**Error Handling Tests:**
- Handle API failures gracefully
- Show appropriate error messages
- Retry functionality works correctly
- Network error recovery

**User Experience Tests:**
- Loading states during generation
- Button states and interactions
- Notification management
- Different puzzles each generation

### 2. Image Upload Workflow (`image-upload.spec.ts`)

**Upload Tests:**
- File selection and preview
- Successful image processing
- Loading states during upload
- Success notification display

**Error Scenarios:**
- Invalid image format
- File size limitations
- Processing failures
- Network interruptions
- Rate limiting handling

**File Handling:**
- Multiple file formats
- Large file handling
- File clearing functionality
- Upload validation

### 3. Responsive Design (`responsive-design.spec.ts`)

**Viewport Testing:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
- Custom viewport sizes

**Mobile Compatibility:**
- Touch interactions
- Portrait/landscape orientation
- Notification positioning
- Error message formatting

**Accessibility:**
- Focus management
- Keyboard navigation
- Screen reader compatibility
- Zoom level handling

## Configuration

### Playwright Configuration (`playwright.config.ts`)

The configuration includes:

**Browser Support:**
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile browsers (Chrome Mobile, Safari Mobile)

**Test Settings:**
- Parallel execution
- Automatic retries on CI
- Screenshot on failure
- Video recording on failure
- Trace collection for debugging

**Reporters:**
- HTML report with screenshots/videos
- JSON report for CI integration
- JUnit XML for test dashboards
- List reporter for console output

### Web Server Configuration

Playwright automatically starts the development servers:
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5000`

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests only
npm run test:e2e:mobile

# Debug specific test
npm run test:e2e:debug -- --grep "should generate easy puzzle"
```

### CI/CD Integration

```bash
# CI mode with retries and videos
CI=true npm run test:e2e

# Generate test report
npm run test:e2e:report
```

### Specific Test Files

```bash
# Run specific test file
npx playwright test puzzle-generation.spec.ts

# Run specific test
npx playwright test --grep "should upload image successfully"

# Run tests matching pattern
npx playwright test --grep "error"
```

## Test Data Management

### Global Setup

The global setup (`global-setup.ts`) handles:
- Server readiness verification
- Test data seeding
- Environment preparation
- Database initialization

### Test Data Seeding

```typescript
// Example test data structure
{
  users: [
    {
      googleId: 'test-user-123',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'user'
    }
  ],
  puzzles: [
    {
      title: 'Test Easy Puzzle',
      difficulty: 'easy',
      puzzleGrid: [...],
      solutionGrid: [...]
    }
  ]
}
```

### Cleanup

The global teardown ensures:
- Test data cleanup
- Resource release
- Temporary file removal

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug -- --grep "test-name"

# Run in headed mode
npm run test:e2e:headed
```

### Trace Viewer

```bash
# Generate and view traces
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots at failure point
- Full video recording
- Network requests/responses
- Console logs

## Mocking and Stubbing

### API Mocking

```typescript
// Mock successful API response
await page.route('**/api/sudoku/generate', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ puzzle: [...], solution: [...] })
  });
});

// Mock error response
await page.route('**/api/sudoku/generate', route => {
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Server error' })
  });
});

// Mock network failure
await page.route('**/api/sudoku/generate', route => {
  route.abort('failed');
});
```

### File Upload Mocking

```typescript
// Mock file upload
await page.setInputFiles('input[type="file"]', {
  name: 'test-sudoku.png',
  mimeType: 'image/png',
  buffer: Buffer.from('fake-image-data')
});
```

## Assertions and Verifications

### Visual Verifications

```typescript
// Element visibility
await expect(page.locator('.sudoku-grid')).toBeVisible();

// Content verification
await expect(page.locator('h1')).toContainText('SudoQMaestro');

// State verification
await expect(page.locator('button')).toBeDisabled();
```

### Custom Assertions

```typescript
// Grid validation
await mainPage.expectValidSudokuGrid();

// Error state verification
await mainPage.expectErrorState();

// Notification verification
await mainPage.waitForNotification('success');
```

## Performance Testing

### Load Time Verification

```typescript
test('should load within acceptable time', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForSelector('h1');
  const loadTime = Date.now() - start;
  
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

### Resource Monitoring

```typescript
// Monitor network requests
page.on('response', response => {
  if (response.status() >= 400) {
    console.log(`Failed request: ${response.url()}`);
  }
});
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and atomic
- Use proper setup and teardown

### 2. Reliable Selectors
- Prefer role-based selectors: `getByRole('button', { name: 'Submit' })`
- Use test IDs when necessary: `data-testid="puzzle-grid"`
- Avoid brittle CSS selectors

### 3. Wait Strategies
- Use explicit waits: `waitForSelector()`, `waitForResponse()`
- Avoid `page.wait()` with fixed timeouts
- Wait for actual conditions, not arbitrary delays

### 4. Error Handling
- Test both happy path and error scenarios
- Verify error messages and recovery options
- Test network failures and timeouts

### 5. Mobile Testing
- Test different viewport sizes
- Verify touch interactions
- Check responsive layout behavior
- Test orientation changes

## Troubleshooting

### Common Issues

**Tests failing intermittently:**
- Add proper waits for dynamic content
- Increase timeouts for slow operations
- Check for race conditions

**Element not found:**
- Verify selector accuracy
- Check if element is in viewport
- Wait for element to be available

**Network errors:**
- Check backend server status
- Verify API endpoint URLs
- Review network mocking setup

**Mobile test failures:**
- Verify viewport configuration
- Check touch vs click interactions
- Review mobile-specific CSS

### Debug Commands

```bash
# Run single test with full logging
DEBUG=pw:api npx playwright test puzzle-generation.spec.ts

# Generate detailed HTML report
npx playwright show-report

# Analyze trace files
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e-results/
```

### Test Reports

- **HTML Report**: Visual test results with screenshots/videos
- **JUnit XML**: Integration with CI/CD dashboards
- **JSON Report**: Programmatic analysis of test results

## Future Enhancements

### Planned Test Additions

1. **Authentication Flow Tests**
   - Google OAuth login/logout
   - Session management
   - Role-based access control

2. **Admin Functionality Tests**
   - User management
   - Puzzle administration
   - System configuration

3. **Performance Tests**
   - Load testing with multiple users
   - Memory leak detection
   - Resource usage monitoring

4. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast validation

### Tool Integrations

- **Visual regression testing** with Percy or Chromatic
- **Performance monitoring** with Lighthouse CI
- **Accessibility testing** with axe-playwright
- **Cross-browser testing** with BrowserStack
