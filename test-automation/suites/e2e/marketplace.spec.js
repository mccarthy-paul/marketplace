import { test, expect } from '@playwright/test';

const MARKETPLACE_URL = process.env.MARKETPLACE_URL || 'http://localhost:5173';

test.describe('Marketplace E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MARKETPLACE_URL);
  });

  test.describe('Homepage', () => {
    test('should load homepage with correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/Luxe Marketplace/i);
      await expect(page.locator('h1')).toContainText(/Luxury Watch Marketplace/i);
    });

    test('should display hero section with login button', async ({ page }) => {
      const heroSection = page.locator('.hero-section');
      await expect(heroSection).toBeVisible();
      
      const loginButton = page.getByRole('button', { name: /Login with Juno/i });
      await expect(loginButton).toBeVisible();
    });

    test('should navigate to watches page', async ({ page }) => {
      const watchesLink = page.getByRole('link', { name: /Browse Watches/i });
      await watchesLink.click();
      
      await expect(page).toHaveURL(/\/watches/);
      await expect(page.locator('h1')).toContainText(/Luxury Watches/i);
    });
  });

  test.describe('Watch Browsing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
    });

    test('should display watch listings', async ({ page }) => {
      await page.waitForSelector('.watch-card', { timeout: 10000 });
      const watchCards = page.locator('.watch-card');
      await expect(watchCards).toHaveCount.greaterThan(0);
    });

    test('should filter watches by brand', async ({ page }) => {
      const brandFilter = page.getByRole('combobox', { name: /Brand/i });
      await brandFilter.selectOption('Rolex');
      
      await page.waitForTimeout(1000);
      
      const watchCards = page.locator('.watch-card');
      const firstWatch = watchCards.first();
      await expect(firstWatch).toContainText(/Rolex/i);
    });

    test('should sort watches by price', async ({ page }) => {
      const sortSelect = page.getByRole('combobox', { name: /Sort/i });
      await sortSelect.selectOption('price-asc');
      
      await page.waitForTimeout(1000);
      
      const prices = await page.locator('.watch-price').allTextContents();
      const numericPrices = prices.map(p => parseInt(p.replace(/[^0-9]/g, '')));
      
      for (let i = 1; i < numericPrices.length; i++) {
        expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i - 1]);
      }
    });

    test('should navigate to watch details page', async ({ page }) => {
      const firstWatch = page.locator('.watch-card').first();
      const watchTitle = await firstWatch.locator('.watch-title').textContent();
      
      await firstWatch.click();
      
      await expect(page).toHaveURL(/\/watches\/[a-f0-9]+/);
      await expect(page.locator('h1')).toContainText(watchTitle);
    });
  });

  test.describe('Watch Details', () => {
    test('should display watch information', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      const firstWatch = page.locator('.watch-card').first();
      await firstWatch.click();
      
      await expect(page.locator('.watch-brand')).toBeVisible();
      await expect(page.locator('.watch-model')).toBeVisible();
      await expect(page.locator('.watch-price')).toBeVisible();
      await expect(page.locator('.watch-condition')).toBeVisible();
    });

    test('should show buy now button for available watches', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      const firstWatch = page.locator('.watch-card').first();
      await firstWatch.click();
      
      const buyButton = page.getByRole('button', { name: /Buy Now/i });
      await expect(buyButton).toBeVisible();
    });

    test('should display watch images', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      const firstWatch = page.locator('.watch-card').first();
      await firstWatch.click();
      
      const watchImage = page.locator('.watch-image, img[alt*="watch"]').first();
      await expect(watchImage).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should redirect to Juno OAuth when clicking login', async ({ page }) => {
      const loginButton = page.getByRole('button', { name: /Login with Juno/i });
      
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        loginButton.click()
      ]);
      
      await popup.waitForLoadState();
      expect(popup.url()).toContain('junomoney.org');
    });

    test('should show user menu after login', async ({ page, context }) => {
      await context.addCookies([{
        name: 'session',
        value: 'test-session',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto(MARKETPLACE_URL);
      await page.evaluate(() => {
        sessionStorage.setItem('user', JSON.stringify({
          email: 'test@example.com',
          name: 'Test User'
        }));
      });
      
      await page.reload();
      
      const userMenu = page.getByTestId('user-menu');
      await expect(userMenu).toBeVisible();
    });
  });

  test.describe('Bidding System', () => {
    test('should show bid form on watch details page', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      
      const watchWithBidding = page.locator('.watch-card').filter({ hasText: /Accepting Bids/i }).first();
      
      if (await watchWithBidding.count() > 0) {
        await watchWithBidding.click();
        
        const bidSection = page.locator('.bid-section, [data-testid="bid-form"]');
        await expect(bidSection).toBeVisible();
        
        const bidInput = page.getByPlaceholder(/Enter bid amount/i);
        await expect(bidInput).toBeVisible();
      }
    });

    test('should validate bid amount', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      
      const watchWithBidding = page.locator('.watch-card').filter({ hasText: /Accepting Bids/i }).first();
      
      if (await watchWithBidding.count() > 0) {
        await watchWithBidding.click();
        
        const bidInput = page.getByPlaceholder(/Enter bid amount/i);
        const submitButton = page.getByRole('button', { name: /Place Bid/i });
        
        await bidInput.fill('100');
        await submitButton.click();
        
        const errorMessage = page.locator('.error-message, [role="alert"]');
        await expect(errorMessage).toContainText(/minimum bid/i);
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should search for watches', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      
      const searchInput = page.getByPlaceholder(/Search watches/i);
      await searchInput.fill('Rolex Submariner');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      const watchCards = page.locator('.watch-card');
      const resultsText = await watchCards.first().textContent();
      
      expect(resultsText).toMatch(/Rolex|Submariner/i);
    });

    test('should show no results message for invalid search', async ({ page }) => {
      await page.goto(`${MARKETPLACE_URL}/watches`);
      
      const searchInput = page.getByPlaceholder(/Search watches/i);
      await searchInput.fill('InvalidWatchName12345');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      const noResults = page.locator('.no-results, [data-testid="no-results"]');
      await expect(noResults).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(MARKETPLACE_URL);
      
      const mobileMenuButton = page.getByRole('button', { name: /menu/i });
      await expect(mobileMenuButton).toBeVisible();
      
      await mobileMenuButton.click();
      
      const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
    });

    test('should stack watch cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${MARKETPLACE_URL}/watches`);
      
      const watchCards = page.locator('.watch-card');
      const firstCard = watchCards.first();
      const secondCard = watchCards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
      }
    });
  });

  test.describe('User Profile', () => {
    test('should navigate to profile page', async ({ page, context }) => {
      await context.addCookies([{
        name: 'session',
        value: 'test-session',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto(MARKETPLACE_URL);
      await page.evaluate(() => {
        sessionStorage.setItem('user', JSON.stringify({
          email: 'test@example.com',
          name: 'Test User'
        }));
      });
      
      await page.reload();
      
      const profileLink = page.getByRole('link', { name: /Profile/i });
      await profileLink.click();
      
      await expect(page).toHaveURL(/\/profile/);
      await expect(page.locator('h1')).toContainText(/Profile/i);
    });
  });
});