# 👁️ Viewing Tests in Real-Time - Complete Guide

## Quick Start Commands

### 1. 🎭 **Playwright UI Mode** (BEST for visual testing)
```bash
npx playwright test --ui
```
This opens an interactive interface where you can:
- ✅ See tests running step-by-step
- ⏸️ Pause and debug at any point
- 🔄 Re-run specific tests instantly
- 📸 View screenshots and traces
- ⏮️ Time-travel through test execution

### 2. 🖥️ **Headed Mode** (Watch in real browser)
```bash
# Run all tests with browser visible
npx playwright test --headed

# Run specific test file slowly
npx playwright test demo.spec.js --headed --timeout=60000

# Run just marketplace tests
npx playwright test marketplace.spec.js --headed
```

### 3. 🐛 **Debug Mode** (Step through tests)
```bash
npx playwright test --debug
```
This will:
- Open Playwright Inspector
- Pause before each action
- Let you step through tests
- Show element selectors

### 4. 📊 **Vitest UI** (For API tests)
```bash
npx vitest --ui
```
Opens a web interface showing:
- Test results in real-time
- Code coverage
- Test duration metrics

### 5. 👀 **Watch Mode** (Auto-rerun on changes)
```bash
# Watch and rerun tests
npx vitest --watch

# With detailed output
npx vitest --watch --reporter=verbose
```

## Test Execution Results

From your test run, you saw:
- ✅ **API Test Passed**: Found 6 watches in marketplace
- ⚠️ **Title Mismatch**: Page title is "Luxe Marketplace" not "Juno Marketplace"
- ⚠️ **Admin Login**: Form fields couldn't be found (might need different selectors)

## Viewing Test Artifacts

### 📹 Videos (if tests were recorded)
```bash
# Open test results folder
open test-results/

# Videos are in folders like:
# test-results/suites-e2e-demo-*/video.webm
```

### 📸 Screenshots
```bash
# View failure screenshots
open test-results/*/screenshot.png
```

### 📊 HTML Report
```bash
# Generate and open HTML report
npx playwright show-report
```

## Running Specific Scenarios

### Test only the marketplace:
```bash
npx playwright test --grep "Marketplace" --headed
```

### Test only the admin panel:
```bash
npx playwright test --grep "Admin" --headed
```

### Run a single test:
```bash
npx playwright test -g "Browse the Luxury Watch Marketplace" --headed
```

## Pro Tips

1. **Slow Down Actions**: Add delays in the test code
```javascript
await page.waitForTimeout(2000); // Wait 2 seconds
```

2. **Take Screenshots**: Capture at key moments
```javascript
await page.screenshot({ path: 'homepage.png' });
```

3. **Trace Viewer**: View detailed execution traces
```bash
# After running tests with trace enabled
npx playwright show-trace
```

4. **Custom Viewport**: Test different screen sizes
```bash
npx playwright test --headed --viewport-size=375,667  # iPhone size
```

## Troubleshooting

If tests are running too fast to see:
1. Use UI mode (`--ui`) for full control
2. Add `waitForTimeout` in test code
3. Use debug mode (`--debug`) to step through

If browser doesn't open:
1. Make sure you use `--headed` flag
2. Check if Playwright browsers are installed: `npx playwright install`
3. Try with a specific browser: `--project=chromium`

## Next Steps

1. **Fix the title test**: Update to expect "Luxe Marketplace"
2. **Fix admin login selectors**: Inspect actual form field attributes
3. **Add more visual feedback**: Include hover effects and animations
4. **Create demo videos**: Record successful test runs for documentation

---

Ready to see your tests in action! 🚀