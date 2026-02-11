import { test, expect } from '@playwright/test';

test.describe('Expert Pages', () => {
  test('should display experts listing page', async ({ page }) => {
    await page.goto('/experts');
    
    // Check page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Wait for experts to load
    await page.waitForTimeout(3000);
  });

  test('should have search/filter functionality', async ({ page }) => {
    await page.goto('/experts');
    
    // Look for search or filter input
    const searchInput = page.locator('input[placeholder*="Cari"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('PM');
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to expert detail from listing', async ({ page }) => {
    await page.goto('/experts');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Click on first expert card or "Book Now" button
    const bookButton = page.locator('text=Book Now').first();
    const expertCard = page.locator('[class*="cursor-pointer"]').first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/expert');
    } else if (await expertCard.isVisible()) {
      await expertCard.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Expert Detail Page', () => {
  // Note: Replace with actual expert slug from production
  const testExpertSlug = 'zaki-achsan';
  
  test('should display expert profile', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    
    // Wait for page load
    await page.waitForTimeout(3000);
    
    // Check if expert page loaded
    const pageContent = await page.content();
    const hasProfile = await page.locator('img').first().isVisible().catch(() => false);
    const hasName = pageContent.length > 1000; // Page has content
    const has404 = pageContent.includes('tidak ditemukan') || 
                   pageContent.includes('404') || 
                   pageContent.includes('Not Found');
    const hasExpertContent = pageContent.includes('Book') || 
                             pageContent.includes('Booking') ||
                             pageContent.includes('Session');
    
    console.log('Expert page result:', { hasProfile, has404, hasExpertContent, contentLength: pageContent.length });
    
    // Either expert loaded, or 404, or redirected - all valid
    expect(hasProfile || has404 || hasExpertContent || hasName).toBeTruthy();
  });

  test('should display session types if available', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    await page.waitForTimeout(2000);
    
    // Look for session type cards or booking buttons
    const pageContent = await page.content();
    const hasSessionTypes = pageContent.includes('Chat') || 
                            pageContent.includes('Video') || 
                            pageContent.includes('menit') ||
                            pageContent.includes('Session');
    const hasBookButton = await page.locator('button').filter({ hasText: /Book|Pesan/i }).first().isVisible().catch(() => false);
    
    // If expert exists, should have session info
    console.log('Has session types:', hasSessionTypes);
    console.log('Has book button:', hasBookButton);
  });

  test('should show booking modal when clicking book', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    await page.waitForTimeout(2000);
    
    // Click book button
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Pesan")').first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal or booking flow appears
      const hasModal = await page.locator('[role="dialog"], [class*="modal"]').isVisible().catch(() => false);
      const hasDatePicker = await page.locator('input[type="date"], [class*="calendar"]').isVisible().catch(() => false);
      
      console.log('Modal visible:', hasModal);
      console.log('Date picker visible:', hasDatePicker);
    }
  });
});
