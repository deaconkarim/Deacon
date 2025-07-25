# End-to-End Testing

This directory contains end-to-end (e2e) tests for the Deacon using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run test:e2e:install
```

## Running Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

### CI/CD (GitHub Actions)
Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

## Test Structure

- `auth.spec.js` - Authentication tests
- `events.spec.js` - Events functionality tests
- `members.spec.js` - Members management tests (to be added)
- `donations.spec.js` - Donations functionality tests (to be added)

## Writing Tests

### Basic Test Structure
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

### Best Practices
1. Use semantic selectors (getByRole, getByLabel, etc.)
2. Add data-testid attributes to components for complex selectors
3. Test user workflows, not implementation details
4. Keep tests independent and isolated
5. Use descriptive test names

### Test Data
- Use test-specific data when possible
- Clean up test data after tests
- Consider using test databases for e2e tests

## Configuration

The tests are configured in `playwright.config.js`:
- Base URL: `http://localhost:5173` (dev) or environment variable
- Browsers: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- Retries: 2 on CI, 0 locally
- Screenshots and videos on failure

## Vercel Integration

### Environment Variables
Set these in Vercel:
- `PLAYWRIGHT_BASE_URL` - Your deployed app URL

### Running Tests Against Deployed App
```bash
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

## Debugging

### View Test Results
```bash
# Open HTML report
npx playwright show-report

# View traces
npx playwright show-trace trace.zip
```

### Debug Mode
```bash
npm run test:e2e:debug
```

## Continuous Integration

The GitHub Actions workflow:
1. Installs dependencies
2. Builds the app
3. Starts the preview server
4. Runs Playwright tests
5. Uploads test results as artifacts

## Test Reports

Test results are available as:
- HTML report in `playwright-report/`
- JSON results in `test-results/results.json`
- JUnit XML in `test-results/results.xml` 