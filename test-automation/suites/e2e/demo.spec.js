import { test, expect } from '@playwright/test';

const MARKETPLACE_URL = process.env.MARKETPLACE_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5174';

test.describe('🎬 Visual Demo - Marketplace Tour', () => {
  test('Browse the Luxury Watch Marketplace', async ({ page }) => {
    // Go to homepage
    await test.step('🏠 Visit Homepage', async () => {
      await page.goto(MARKETPLACE_URL);
      await page.waitForTimeout(1000); // Pause to see the page
      await expect(page).toHaveTitle(/Luxe Marketplace/i);
    });

    // Check hero section
    await test.step('👀 View Hero Section', async () => {
      const heroSection = page.locator('.hero-section').first();
      if (await heroSection.count() > 0) {
        await heroSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
      }
    });

    // Navigate to watches
    await test.step('⌚ Browse Watches', async () => {
      // Try multiple possible selectors for the watches link
      const watchesLink = page.getByRole('link', { name: /watches/i }).first() ||
                         page.locator('a[href*="watches"]').first();
      
      if (await watchesLink.count() > 0) {
        await watchesLink.click();
        await page.waitForTimeout(2000);
      } else {
        // Direct navigation if link not found
        await page.goto(`${MARKETPLACE_URL}/watches`);
        await page.waitForTimeout(2000);
      }
    });

    // Interact with filters
    await test.step('🔍 Try Search and Filters', async () => {
      // Try to find and use search
      const searchInput = page.getByPlaceholder(/search/i).first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('Rolex');
        await page.waitForTimeout(1000);
        await searchInput.clear();
        await page.waitForTimeout(500);
      }

      // Try brand filter
      const brandFilter = page.getByRole('combobox', { name: /brand/i }).first() ||
                         page.locator('select').first();
      if (await brandFilter.count() > 0) {
        await brandFilter.selectOption({ index: 1 }).catch(() => {});
        await page.waitForTimeout(1500);
      }
    });

    // Click on a watch
    await test.step('📋 View Watch Details', async () => {
      const watchCard = page.locator('.watch-card, [data-testid*="watch"], a[href*="/watches/"]').first();
      if (await watchCard.count() > 0) {
        await watchCard.click();
        await page.waitForTimeout(2000);
        
        // Scroll to see details
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(1000);
      }
    });

    // Go back to homepage
    await test.step('🏠 Return Home', async () => {
      await page.goto(MARKETPLACE_URL);
      await page.waitForTimeout(1000);
    });
  });
});

test.describe('🎬 Visual Demo - Admin Dashboard', () => {
  test('Tour the Admin Dashboard', async ({ page }) => {
    // Go to admin login
    await test.step('🔐 Admin Login Page', async () => {
      await page.goto(`${ADMIN_URL}/login`);
      await page.waitForTimeout(1000);
    });

    // Fill login form
    await test.step('📝 Fill Login Form', async () => {
      // Try multiple selectors for email field
      const emailField = page.locator('input[type="email"]').first() ||
                        page.locator('input[name*="email"]').first() ||
                        page.locator('input[placeholder*="email" i]').first() ||
                        page.locator('#email').first();
      
      if (await emailField.count() > 0) {
        await emailField.fill('admin@luxe24.com');
        await page.waitForTimeout(500);
      }
      
      // Try multiple selectors for password field
      const passwordField = page.locator('input[type="password"]').first() ||
                           page.locator('input[name*="password"]').first() ||
                           page.locator('input[placeholder*="password" i]').first() ||
                           page.locator('#password').first();
      
      if (await passwordField.count() > 0) {
        await passwordField.fill('admin123');
        await page.waitForTimeout(500);
      }
      
      // Try multiple selectors for login button
      const loginButton = page.getByRole('button', { name: /login/i }).first() ||
                         page.locator('button[type="submit"]').first() ||
                         page.locator('button').filter({ hasText: /login/i }).first();
      
      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForTimeout(2000);
      }
    });

    // View dashboard
    await test.step('📊 View Dashboard Statistics', async () => {
      // Wait for dashboard to load
      await page.waitForSelector('h1, h2', { timeout: 5000 }).catch(() => {});
      
      // Scroll to see all stats
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(1500);
    });

    // Navigate to different sections
    await test.step('🔄 Navigate Admin Sections', async () => {
      // Try to click on watches management
      const watchesLink = page.getByRole('link', { name: /watches/i }).first();
      if (await watchesLink.count() > 0) {
        await watchesLink.click();
        await page.waitForTimeout(2000);
      }

      // Try to go back to dashboard
      const dashboardLink = page.getByRole('link', { name: /dashboard/i }).first();
      if (await dashboardLink.count() > 0) {
        await dashboardLink.click();
        await page.waitForTimeout(1500);
      }
    });
  });
});

test.describe('🎬 Quick API Health Check', () => {
  test('Check API Endpoints', async ({ request }) => {
    await test.step('✅ Check API Health', async () => {
      const response = await request.get('http://localhost:8001/api/watches');
      expect(response.status()).toBe(200);
      
      const watches = await response.json();
      console.log(`Found ${watches.length} watches in the marketplace`);
    });
  });
});