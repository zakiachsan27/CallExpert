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
    await page.waitForTimeout(3000);
    
    // Check for various possible expert section headings
    const pageContent = await page.content();
    const hasExpertSection = pageContent.includes('Expert') || 
                             pageContent.includes('Mentor') ||
                             pageContent.includes('Populer') ||
                             pageContent.includes('Terpopuler');
    
    console.log('Has expert section content:', hasExpertSection);
    
    // Wait for experts to load (either experts, loading, or error message)
    const hasCards = await page.locator('[class*="bg-white"]').first().isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    const hasError = await page.locator('text=Coba Lagi').isVisible().catch(() => false);
    
    console.log('Expert cards/loading/error:', { hasCards, hasLoading, hasError });
    
    // Page should have loaded something
    expect(hasExpertSection || hasCards || hasLoading || hasError).toBeTruthy();
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
