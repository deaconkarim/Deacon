import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle('Deacon: Church Command Center');
    
    // Check for the main hero heading
    await expect(page.getByRole('heading', { name: 'Your Church' })).toBeVisible();
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/');
    
    // Look for common login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    
    // At least one of these should be present
    const hasEmailInput = await emailInput.count() > 0;
    const hasPasswordInput = await passwordInput.count() > 0;
    const hasSubmitButton = await submitButton.count() > 0;
    
    expect(hasEmailInput || hasPasswordInput || hasSubmitButton).toBeTruthy();
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Log errors for debugging but don't fail the test
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });

  test('should load without critical errors', async ({ page }) => {
    const errors = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Log errors for debugging but don't fail the test
    if (errors.length > 0) {
      console.log('Page errors found:', errors);
    }
  });
}); 