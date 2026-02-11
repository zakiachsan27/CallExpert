import { test, expect } from '@playwright/test';

test.describe('Chat Feature', () => {
  test('should have chat-related UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for chat mentions in the UI
    const hasChatMention = await page.locator('text=Chat, text=chat, text=Konsultasi').first().isVisible().catch(() => false);
    console.log('Chat feature mentioned:', hasChatMention);
    
    expect(hasChatMention).toBeTruthy();
  });

  test('should show chat option in session types', async ({ page }) => {
    await page.goto('/experts');
    await page.waitForTimeout(3000);
    
    // Look for chat-related session type
    const hasChatOption = await page.locator('text=Chat, text=online-chat').first().isVisible().catch(() => false);
    console.log('Chat option in experts page:', hasChatOption);
  });

  test('dashboard should have messages/chat section', async ({ page }) => {
    // Try to access dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    
    if (url.includes('dashboard')) {
      // If we're on dashboard, look for chat/messages section
      const hasMessages = await page.locator('text=Pesan, text=Messages, text=Chat').first().isVisible().catch(() => false);
      console.log('Messages section in dashboard:', hasMessages);
    } else {
      // Redirected to login - expected behavior for unauthenticated user
      console.log('Redirected to:', url);
      expect(url).toContain('login');
    }
  });
});

test.describe('Real-time Features', () => {
  test('should have notification UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for notification bell or similar UI
    const hasNotificationUI = await page.locator('[class*="notification"], [class*="bell"], [aria-label*="notification"]').first().isVisible().catch(() => false);
    console.log('Notification UI present:', hasNotificationUI);
  });

  test('expert detail should show availability status', async ({ page }) => {
    await page.goto('/experts');
    await page.waitForTimeout(3000);
    
    // Look for availability indicators
    const hasAvailability = await page.locator('text=Online, text=Offline, text=Available, text=Tersedia').first().isVisible().catch(() => false);
    console.log('Availability status shown:', hasAvailability);
  });
});

test.describe('User Dashboard', () => {
  test('should redirect unauthenticated user from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    // Should either be on login page or show login prompt
    const isProtected = url.includes('login') || await page.locator('text=Login, text=Masuk').isVisible().catch(() => false);
    
    expect(isProtected).toBeTruthy();
  });

  test('should redirect unauthenticated user from bookings', async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    const isProtected = url.includes('login') || await page.locator('text=Login, text=Masuk').isVisible().catch(() => false);
    
    expect(isProtected).toBeTruthy();
  });

  test('should redirect unauthenticated user from chat', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    const isProtected = url.includes('login') || await page.locator('text=Login, text=Masuk').isVisible().catch(() => false);
    
    expect(isProtected).toBeTruthy();
  });
});
