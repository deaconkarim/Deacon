const { test, expect } = require('@playwright/test');

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to events page (assuming user is logged in)
    await page.goto('/events');
  });

  test('should display events page', async ({ page }) => {
    // Check if events page loads correctly
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create new event/i })).toBeVisible();
  });

  test('should open create event dialog', async ({ page }) => {
    // Click create event button
    await page.getByRole('button', { name: /create new event/i }).click();
    
    // Check if dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create new event/i })).toBeVisible();
  });

  test('should create a new event', async ({ page }) => {
    // Open create event dialog
    await page.getByRole('button', { name: /create new event/i }).click();
    
    // Fill in event details
    await page.getByLabel(/title/i).fill('Test Event');
    await page.getByLabel(/description/i).fill('This is a test event');
    await page.getByLabel(/start date/i).fill('2024-12-25T10:00');
    await page.getByLabel(/end date/i).fill('2024-12-25T11:00');
    await page.getByLabel(/location/i).fill('Test Location');
    
    // Submit the form
    await page.getByRole('button', { name: /save/i }).click();
    
    // Check if event was created (should show success message or new event in list)
    await expect(page.getByText(/event created successfully/i)).toBeVisible();
  });

  test('should display event cards', async ({ page }) => {
    // Check if event cards are displayed
    await expect(page.locator('[data-testid="event-card"]')).toBeVisible();
  });
}); 