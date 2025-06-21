# E2E Testing Setup for CI/CD

This setup provides end-to-end testing for your Church App that runs in your continuous deployment pipeline.

## 🚀 Quick Start

### 1. GitHub Secrets Setup
Add these secrets to your GitHub repository:

- `VERCEL_URL` - Your deployed Vercel app URL (e.g., `https://your-app.vercel.app`)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### 2. Test Your Deployed App
```bash
# Test against your deployed app
npm run test:deployed https://your-app.vercel.app
```

## 📋 What's Included

### Test Files
- `tests/e2e/smoke.spec.js` - Basic smoke tests for CI/CD
- `tests/e2e/auth.spec.js` - Authentication tests
- `tests/e2e/events.spec.js` - Events functionality tests

### CI/CD Workflows
- `.github/workflows/e2e-tests.yml` - Runs on push/PR
- `.github/workflows/vercel-e2e.yml` - Runs after Vercel deployment

### Configuration
- `playwright.config.js` - Optimized for CI/CD
- `scripts/test-deployed.js` - Manual testing script

## 🔧 How It Works

### Automated Testing
1. **Push/PR Tests**: Runs basic tests on every push and pull request
2. **Deployment Tests**: Runs comprehensive tests after successful Vercel deployment
3. **Cross-browser**: Tests on Chrome and Mobile Chrome
4. **Artifacts**: Uploads test results and screenshots

### Manual Testing
```bash
# Test specific URL
npm run test:deployed https://your-app.vercel.app

# Test with specific test file
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npx playwright test auth.spec.js
```

## 📊 Test Coverage

### Smoke Tests
- ✅ Page loads without errors
- ✅ Basic UI elements are visible
- ✅ Responsive design works
- ✅ No console errors

### Authentication Tests
- ✅ Login form displays correctly
- ✅ Validation errors show properly
- ✅ Invalid credentials handled

### Events Tests
- ✅ Events page loads
- ✅ Create event functionality
- ✅ Check-in/RSVP features
- ✅ Mobile responsiveness

## 🛠️ Troubleshooting

### Tests Failing?
1. Check the deployed URL is correct
2. Verify environment variables are set
3. Check test artifacts for screenshots/videos
4. Review console logs for errors

### Local Issues?
- Skip local testing - focus on CI/CD
- Use `npm run test:deployed` to test deployed app
- Check GitHub Actions logs for detailed output

## 🎯 Next Steps

1. **Deploy your app** to Vercel
2. **Set up GitHub secrets** with your app URL
3. **Push to main branch** to trigger first test run
4. **Monitor GitHub Actions** for test results
5. **Review test artifacts** for any issues

## 📈 Benefits

- ✅ **Quality Assurance** - Catch bugs before users do
- ✅ **Regression Testing** - Ensure new features don't break existing ones
- ✅ **Cross-browser Testing** - Verify app works everywhere
- ✅ **Mobile Testing** - Ensure mobile responsiveness
- ✅ **Automated CI/CD** - No manual testing required
- ✅ **Visual Feedback** - Screenshots and videos for debugging

Your Church App now has robust e2e testing that runs automatically in your deployment pipeline! 🎉 