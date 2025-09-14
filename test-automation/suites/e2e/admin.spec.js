import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5174';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@luxe24.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

test.describe('Admin Application E2E Tests', () => {
  test.describe('Admin Authentication', () => {
    test('should display login page', async ({ page }) => {
      await page.goto(`${ADMIN_URL}/login`);
      
      await expect(page.locator('h1, h2')).toContainText(/Admin Login/i);
      await expect(page.getByPlaceholder(/Email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/Password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${ADMIN_URL}/login`);
      
      await page.getByPlaceholder(/Email/i).fill('invalid@example.com');
      await page.getByPlaceholder(/Password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /Login/i }).click();
      
      const errorMessage = page.locator('.error-message, [role="alert"]');
      await expect(errorMessage).toContainText(/Invalid credentials/i);
    });

    test('should login with valid credentials', async ({ page }) => {
      await page.goto(`${ADMIN_URL}/login`);
      
      await page.getByPlaceholder(/Email/i).fill(ADMIN_EMAIL);
      await page.getByPlaceholder(/Password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /Login/i }).click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/dashboard`);
      await expect(page.locator('h1')).toContainText(/Admin Dashboard/i);
    });

    test('should logout successfully', async ({ page }) => {
      await loginAsAdmin(page);
      
      const logoutButton = page.getByRole('button', { name: /Logout/i });
      await logoutButton.click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/login`);
    });
  });

  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display dashboard statistics', async ({ page }) => {
      await expect(page.locator('[data-testid="stat-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-watches"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="stat-bids"]')).toBeVisible();
    });

    test('should navigate to watches management', async ({ page }) => {
      const watchesLink = page.getByRole('link', { name: /Manage Watches/i });
      await watchesLink.click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/watches`);
      await expect(page.locator('h1')).toContainText(/Watch Management/i);
    });

    test('should navigate to users management', async ({ page }) => {
      const usersLink = page.getByRole('link', { name: /Manage Users/i });
      await usersLink.click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/users`);
      await expect(page.locator('h1')).toContainText(/User Management/i);
    });

    test('should navigate to orders management', async ({ page }) => {
      const ordersLink = page.getByRole('link', { name: /Manage Orders/i });
      await ordersLink.click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/orders`);
      await expect(page.locator('h1')).toContainText(/Order Management/i);
    });

    test('should navigate to bids management', async ({ page }) => {
      const bidsLink = page.getByRole('link', { name: /Manage Bids/i });
      await bidsLink.click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/bids`);
      await expect(page.locator('h1')).toContainText(/Bid Management/i);
    });
  });

  test.describe('Watch Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/watches`);
    });

    test('should display watch list', async ({ page }) => {
      await page.waitForSelector('.watch-table, [data-testid="watch-list"]');
      const watchRows = page.locator('tr[data-watch-id], .watch-item');
      await expect(watchRows.first()).toBeVisible();
    });

    test('should search for watches', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search watches/i);
      await searchInput.fill('Rolex');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      const watchRows = page.locator('tr[data-watch-id], .watch-item');
      const firstWatch = await watchRows.first().textContent();
      expect(firstWatch).toContain('Rolex');
    });

    test('should open add watch form', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /Add Watch/i });
      await addButton.click();
      
      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText(/Add.*Watch/i);
    });

    test('should edit watch details', async ({ page }) => {
      const editButton = page.locator('[data-action="edit"]').first();
      await editButton.click();
      
      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const priceInput = modal.getByLabel(/Price/i);
      await priceInput.clear();
      await priceInput.fill('15000');
      
      const saveButton = modal.getByRole('button', { name: /Save/i });
      await saveButton.click();
      
      await expect(modal).not.toBeVisible();
    });

    test('should delete watch', async ({ page }) => {
      const deleteButton = page.locator('[data-action="delete"]').first();
      
      page.on('dialog', dialog => dialog.accept());
      await deleteButton.click();
      
      const successMessage = page.locator('.success-message, [role="status"]');
      await expect(successMessage).toContainText(/deleted successfully/i);
    });
  });

  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/users`);
    });

    test('should display user list', async ({ page }) => {
      await page.waitForSelector('.user-table, [data-testid="user-list"]');
      const userRows = page.locator('tr[data-user-id], .user-item');
      await expect(userRows.first()).toBeVisible();
    });

    test('should search for users', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search users/i);
      await searchInput.fill('admin');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      const userRows = page.locator('tr[data-user-id], .user-item');
      const firstUser = await userRows.first().textContent();
      expect(firstUser).toContain('admin');
    });

    test('should toggle user admin status', async ({ page }) => {
      const adminToggle = page.locator('[data-action="toggle-admin"]').first();
      const initialState = await adminToggle.isChecked();
      
      await adminToggle.click();
      
      const successMessage = page.locator('.success-message, [role="status"]');
      await expect(successMessage).toContainText(/updated successfully/i);
      
      const newState = await adminToggle.isChecked();
      expect(newState).toBe(!initialState);
    });

    test('should view user details', async ({ page }) => {
      const viewButton = page.locator('[data-action="view"]').first();
      await viewButton.click();
      
      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h2')).toContainText(/User Details/i);
    });
  });

  test.describe('Order Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/orders`);
    });

    test('should display order list', async ({ page }) => {
      await page.waitForSelector('.order-table, [data-testid="order-list"]');
      const orderRows = page.locator('tr[data-order-id], .order-item');
      
      if (await orderRows.count() > 0) {
        await expect(orderRows.first()).toBeVisible();
      } else {
        const noOrders = page.locator('.no-orders, [data-testid="no-orders"]');
        await expect(noOrders).toContainText(/No orders/i);
      }
    });

    test('should filter orders by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status/i });
      
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('completed');
        await page.waitForTimeout(1000);
        
        const orderRows = page.locator('tr[data-order-id], .order-item');
        if (await orderRows.count() > 0) {
          const statusBadge = orderRows.first().locator('.status-badge, [data-status]');
          await expect(statusBadge).toContainText(/completed/i);
        }
      }
    });

    test('should view order details', async ({ page }) => {
      const orderRows = page.locator('tr[data-order-id], .order-item');
      
      if (await orderRows.count() > 0) {
        const viewButton = page.locator('[data-action="view"]').first();
        await viewButton.click();
        
        const modal = page.locator('.modal, [role="dialog"]');
        await expect(modal).toBeVisible();
        await expect(modal.locator('h2')).toContainText(/Order Details/i);
      }
    });

    test('should refresh order status from JunoPay', async ({ page }) => {
      const orderRows = page.locator('tr[data-order-id], .order-item');
      
      if (await orderRows.count() > 0) {
        const refreshButton = page.locator('[data-action="refresh-status"]').first();
        await refreshButton.click();
        
        const message = page.locator('.success-message, .error-message, [role="status"]');
        await expect(message).toBeVisible();
      }
    });
  });

  test.describe('Bid Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_URL}/bids`);
    });

    test('should display bid list', async ({ page }) => {
      await page.waitForSelector('.bid-table, [data-testid="bid-list"]');
      const bidRows = page.locator('tr[data-bid-id], .bid-item');
      
      if (await bidRows.count() > 0) {
        await expect(bidRows.first()).toBeVisible();
      } else {
        const noBids = page.locator('.no-bids, [data-testid="no-bids"]');
        await expect(noBids).toContainText(/No bids/i);
      }
    });

    test('should filter bids by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status/i });
      
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('accepted');
        await page.waitForTimeout(1000);
        
        const bidRows = page.locator('tr[data-bid-id], .bid-item');
        if (await bidRows.count() > 0) {
          const statusBadge = bidRows.first().locator('.status-badge, [data-status]');
          await expect(statusBadge).toContainText(/accepted/i);
        }
      }
    });

    test('should view bid details', async ({ page }) => {
      const bidRows = page.locator('tr[data-bid-id], .bid-item');
      
      if (await bidRows.count() > 0) {
        const viewButton = page.locator('[data-action="view"]').first();
        await viewButton.click();
        
        const modal = page.locator('.modal, [role="dialog"]');
        await expect(modal).toBeVisible();
        await expect(modal.locator('h2')).toContainText(/Bid Details/i);
      }
    });

    test('should update bid status', async ({ page }) => {
      const bidRows = page.locator('tr[data-bid-id], .bid-item');
      
      if (await bidRows.count() > 0) {
        const actionButton = page.locator('[data-action="update-status"]').first();
        await actionButton.click();
        
        const statusSelect = page.getByRole('combobox', { name: /New Status/i });
        await statusSelect.selectOption('accepted');
        
        const confirmButton = page.getByRole('button', { name: /Confirm/i });
        await confirmButton.click();
        
        const successMessage = page.locator('.success-message, [role="status"]');
        await expect(successMessage).toContainText(/updated successfully/i);
      }
    });
  });

  test.describe('Admin Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should have working breadcrumbs', async ({ page }) => {
      await page.goto(`${ADMIN_URL}/watches`);
      
      const breadcrumbs = page.locator('.breadcrumbs, [aria-label="Breadcrumb"]');
      await expect(breadcrumbs).toBeVisible();
      
      const dashboardLink = breadcrumbs.getByRole('link', { name: /Dashboard/i });
      await dashboardLink.click();
      
      await expect(page).toHaveURL(`${ADMIN_URL}/dashboard`);
    });

    test('should have working sidebar navigation', async ({ page }) => {
      const sidebar = page.locator('.sidebar, [role="navigation"]');
      await expect(sidebar).toBeVisible();
      
      const menuItems = sidebar.locator('a[href]');
      await expect(menuItems).toHaveCount.greaterThan(3);
    });

    test('should display admin header', async ({ page }) => {
      const header = page.locator('header, .admin-header');
      await expect(header).toBeVisible();
      await expect(header).toContainText(/Admin/i);
    });
  });

  test.describe('Data Export', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should export watch data', async ({ page }) => {
      await page.goto(`${ADMIN_URL}/watches`);
      
      const exportButton = page.getByRole('button', { name: /Export/i });
      
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;
        
        expect(download.suggestedFilename()).toMatch(/watches.*\.(csv|xlsx|json)/i);
      }
    });

    test('should export user data', async ({ page }) => {
      await page.goto(`${ADMIN_URL}/users`);
      
      const exportButton = page.getByRole('button', { name: /Export/i });
      
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;
        
        expect(download.suggestedFilename()).toMatch(/users.*\.(csv|xlsx|json)/i);
      }
    });
  });
});

async function loginAsAdmin(page) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByPlaceholder(/Email/i).fill(ADMIN_EMAIL);
  await page.getByPlaceholder(/Password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Login/i }).click();
  await page.waitForURL(`${ADMIN_URL}/dashboard`);
}