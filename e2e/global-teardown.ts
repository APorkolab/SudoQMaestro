import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clean up test data if needed
    console.log('🗑️ Cleaning up test data...');
    try {
      await page.request.delete('http://localhost:5000/api/test/cleanup');
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.log('ℹ️ Test data cleanup not available (this is normal if cleanup endpoint is not implemented)');
    }
    
  } catch (error) {
    console.error('⚠️ Global teardown encountered an error:', error);
    // Don't throw - teardown errors shouldn't fail the entire test suite
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎉 E2E test environment cleaned up!');
}

export default globalTeardown;
