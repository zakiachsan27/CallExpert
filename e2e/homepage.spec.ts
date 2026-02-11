import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Mentoring');
    
    // Check search bar exists
    await expect(page.locator('input[placeholder*="Cari"]')).toBeVisible();
  });

  test('should display featured experts section', async ({ page }) => {
    await page.goto('/');
    
    // Wait for loading to complete (max 15s for retry mechanism)
    await page.waitForSelector('text=Expert Terpopuler', { timeout: 5000 });
    
    // Check section exists
    await expect(page.locator('text=Expert Terpopuler')).toBeVisible();
    
    // Wait for experts to load (either experts or error message)
    const hasExperts = await page.locator('[class*="min-w-"][class*="bg-white"]').first().isVisible({ timeout: 15000 }).catch(() => false);
    const hasError = await page.locator('text=Coba Lagi').isVisible().catch(() => false);
    const hasNoExperts = await page.locator('text=Belum ada expert').isVisible().catch(() => false);
    
    // One of these should be true
    expect(hasExperts || hasError || hasNoExperts).toBeTruthy();
  });

  test('should navigate to experts page from search', async ({ page }) => {
    await page.goto('/');
    
    // Type in search box
    await page.fill('input[placeholder*="Cari"]', 'Product Manager');
    await page.press('input[placeholder*="Cari"]', 'Enter');
    
    // Should navigate to experts page with search query
    await expect(page).toHaveURL(/\/experts\?search=Product/);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Click "Lihat Semua Expert" button
    await page.click('text=Lihat Semua Expert');
    await expect(page).toHaveURL('/experts');
  });
});
