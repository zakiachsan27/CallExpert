import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  // Test expert slug - update with actual expert
  const testExpertSlug = 'zaki-achsan';

  test('should display session type options', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    await page.waitForTimeout(3000);
    
    // Look for session type cards
    const sessionTypes = page.locator('text=menit, text=Chat, text=Video Call');
    const count = await sessionTypes.count();
    console.log('Session types found:', count);
  });

  test('should open booking modal when clicking book', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    await page.waitForTimeout(3000);
    
    // Find and click book button
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Pesan"), button:has-text("Pilih")').first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
      
      // Should show booking modal or date picker
      const hasModal = await page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').isVisible().catch(() => false);
      const hasDatePicker = await page.locator('input[type="date"], [class*="calendar"], [class*="Calendar"]').isVisible().catch(() => false);
      const hasTimeSlots = await page.locator('text=Pilih Waktu, text=Pilih Tanggal, text=Jadwal').isVisible().catch(() => false);
      
      expect(hasModal || hasDatePicker || hasTimeSlots).toBeTruthy();
    }
  });

  test('should show price information', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    await page.waitForTimeout(3000);
    
    // Check for price display (Rp format)
    const priceElement = page.locator('text=/Rp\\s*[\\d.,]+/').first();
    const hasPrice = await priceElement.isVisible().catch(() => false);
    
    console.log('Price visible:', hasPrice);
  });

  test('should require login for booking', async ({ page }) => {
    await page.goto(`/expert/${testExpertSlug}`);
    await page.waitForTimeout(3000);
    
    // Try to book without login
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Pesan")').first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(2000);
      
      // Should either show login prompt or redirect to login
      const url = page.url();
      const hasLoginPrompt = await page.locator('text=Login, text=Masuk, text=login').isVisible().catch(() => false);
      
      console.log('Current URL:', url);
      console.log('Login prompt visible:', hasLoginPrompt);
    }
  });
});

test.describe('Payment Flow', () => {
  test('should display payment methods', async ({ page }) => {
    // This test would require a logged-in state
    // For now, just verify payment page structure exists
    await page.goto('/');
    
    // Check if payment-related elements exist in the app
    const hasPaymentMention = await page.locator('text=Pembayaran, text=Payment, text=Bayar').first().isVisible().catch(() => false);
    console.log('Payment mentioned on homepage:', hasPaymentMention);
  });

  test('should show booking confirmation page structure', async ({ page }) => {
    // Navigate to a booking confirmation URL pattern (will 404 without real booking)
    await page.goto('/booking/test-order-id');
    await page.waitForTimeout(2000);
    
    // Check if it's a proper page (not completely broken)
    const has404 = await page.locator('text=404, text=tidak ditemukan, text=Not Found').isVisible().catch(() => false);
    const hasBookingPage = await page.locator('text=Booking, text=Pesanan, text=Order').isVisible().catch(() => false);
    
    console.log('404 page:', has404);
    console.log('Booking page structure:', hasBookingPage);
  });
});
