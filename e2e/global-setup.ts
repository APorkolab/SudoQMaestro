import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('⏳ Waiting for frontend to be ready...');
    // Wait for the frontend to be accessible
    await page.goto(baseURL || 'http://localhost:4200', { timeout: 60000 });
    await page.waitForSelector('h1', { timeout: 30000 });
    console.log('✅ Frontend is ready');
    
    console.log('⏳ Waiting for backend to be ready...');
    // Check backend health
    const response = await page.request.get('http://localhost:5000/health');
    if (response.status() !== 200) {
      throw new Error('Backend health check failed');
    }
    console.log('✅ Backend is ready');
    
    console.log('🗃️ Seeding test data...');
    // Seed test data if needed
    try {
      await page.request.post('http://localhost:5000/api/test/seed', {
        data: {
          users: [
            {
              googleId: 'test-user-123',
              displayName: 'Test User',
              email: 'test@example.com',
              role: 'user'
            },
            {
              googleId: 'admin-user-456',
              displayName: 'Admin User',
              email: 'admin@example.com',
              role: 'admin'
            }
          ],
          puzzles: [
            {
              title: 'Test Easy Puzzle',
              difficulty: 'easy',
              puzzleGrid: [
                [5, 3, 0, 0, 7, 0, 0, 0, 0],
                [6, 0, 0, 1, 9, 5, 0, 0, 0],
                [0, 9, 8, 0, 0, 0, 0, 6, 0],
                [8, 0, 0, 0, 6, 0, 0, 0, 3],
                [4, 0, 0, 8, 0, 3, 0, 0, 1],
                [7, 0, 0, 0, 2, 0, 0, 0, 6],
                [0, 6, 0, 0, 0, 0, 2, 8, 0],
                [0, 0, 0, 4, 1, 9, 0, 0, 5],
                [0, 0, 0, 0, 8, 0, 0, 7, 9]
              ],
              solutionGrid: [
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
            }
          ]
        }
      });
      console.log('✅ Test data seeded successfully');
    } catch (error) {
      console.log('ℹ️ Test data seeding not available (this is normal if seed endpoint is not implemented)');
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎉 E2E test environment is ready!');
}

export default globalSetup;
