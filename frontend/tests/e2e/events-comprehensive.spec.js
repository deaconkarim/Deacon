const { test, expect } = require('@playwright/test');

test.describe('Events Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to events page
    await page.goto('/events');
  });

  test('should display events page with all elements', async ({ page }) => {
    // Check main page elements
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    await expect(page.getByText(/manage and track event attendance/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create new event/i })).toBeVisible();
  });

  test('should create and manage events', async ({ page }) => {
    // Open create event dialog
    await page.getByRole('button', { name: /create new event/i }).click();
    
    // Fill in event details
    await page.getByLabel(/title/i).fill('Sunday Service');
    await page.getByLabel(/description/i).fill('Weekly Sunday worship service');
    await page.getByLabel(/start date/i).fill('2024-12-29T09:00');
    await page.getByLabel(/end date/i).fill('2024-12-29T10:30');
    await page.getByLabel(/location/i).fill('Main Sanctuary');
    
    // Enable RSVP
    await page.getByLabel(/allow rsvp/i).check();
    
    // Submit the form
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify event was created
    await expect(page.getByText(/event created successfully/i)).toBeVisible();
    
    // Check if event appears in the list
    await expect(page.getByText('Sunday Service')).toBeVisible();
  });

  test('should handle event check-in functionality', async ({ page }) => {
    // Assuming there's an event with check-in enabled
    const eventCard = page.locator('[data-testid="event-card"]').first();
    
    // Click RSVP/Check-in button
    await eventCard.getByRole('button', { name: /rsvp|check in/i }).click();
    
    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/available people/i)).toBeVisible();
    
    // Search for a member
    await page.getByPlaceholder(/search people/i).fill('John');
    
    // Select a member (if available)
    const memberItem = page.locator('[data-testid="member-item"]').first();
    if (await memberItem.isVisible()) {
      await memberItem.click();
      
      // Verify member was added
      await expect(page.getByText(/checked in|rsvp'd/i)).toBeVisible();
    }
  });

  test('should add new person during check-in', async ({ page }) => {
    // Open an event for check-in
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.getByRole('button', { name: /rsvp|check in/i }).click();
    
    // Click "Add New Person" button
    await page.getByRole('button', { name: /add new person/i }).click();
    
    // Fill in new person details
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('jane.doe@example.com');
    await page.getByLabel(/phone/i).fill('555-1234');
    
    // Submit the form
    await page.getByRole('button', { name: /create and check in|create and rsvp/i }).click();
    
    // Verify success message
    await expect(page.getByText(/new visitor created/i)).toBeVisible();
  });

  test('should manage event volunteers', async ({ page }) => {
    // Find an event that needs volunteers
    const eventCard = page.locator('[data-testid="event-card"]').first();
    
    // Click "Manage Volunteers" button if available
    const volunteerButton = eventCard.getByRole('button', { name: /manage volunteers/i });
    if (await volunteerButton.isVisible()) {
      await volunteerButton.click();
      
      // Verify volunteer dialog opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/manage volunteers/i)).toBeVisible();
      
      // Check tabs
      await expect(page.getByRole('tab', { name: /current volunteers/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /add volunteer/i })).toBeVisible();
    }
  });

  test('should edit existing events', async ({ page }) => {
    // Find an event and click edit
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.getByRole('button', { name: /edit/i }).click();
    
    // Verify edit dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/edit event/i)).toBeVisible();
    
    // Modify event details
    await page.getByLabel(/title/i).clear();
    await page.getByLabel(/title/i).fill('Updated Event Title');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify success message
    await expect(page.getByText(/event updated successfully/i)).toBeVisible();
  });

  test('should handle mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await expect(page.getByRole('button', { name: /create new event/i })).toBeVisible();
    
    // Check if event cards stack properly on mobile
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first()).toBeVisible();
    
    // Verify mobile-optimized buttons
    const buttons = page.locator('button');
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(40); // Minimum touch target size
    }
  });

  test('should handle potluck RSVP functionality', async ({ page }) => {
    // Find a potluck event
    const potluckEvent = page.locator('[data-testid="event-card"]').filter({ hasText: /potluck/i }).first();
    
    if (await potluckEvent.isVisible()) {
      // Click potluck RSVP button
      await potluckEvent.getByRole('button', { name: /potluck rsvp/i }).click();
      
      // Verify potluck dialog opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/potluck rsvp/i)).toBeVisible();
      
      // Fill in potluck details
      await page.getByLabel(/dish type/i).selectOption('main');
      await page.getByLabel(/dish description/i).fill('Chicken Casserole');
      
      // Submit RSVP
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Verify success message
      await expect(page.getByText(/rsvp submitted/i)).toBeVisible();
    }
  });
}); 