import { test, expect } from '@playwright/test';

test.describe('TC25 - Verify Scroll Up using Arrow button and Scroll Down', () => {
  test('Scroll down to Subscription, then scroll up with arrow and verify hero text', async ({ page, baseURL }) => {
    // 1-2) Launch + Navigate
    await page.goto(baseURL ?? 'http://automationexercise.com', { waitUntil: 'domcontentloaded' });

    // 3) Home visible: header + slider (hero)
    await expect(page.locator('header#header')).toBeVisible();
    await expect(page.locator('#slider')).toBeVisible();

    // 4) Scroll down hasta el fondo
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 5) Verificar 'SUBSCRIPTION' visible (footer widget)
    const subscriptionHeading = page.getByRole('heading', { name: /subscription/i });
    await expect(subscriptionHeading).toBeVisible();

    // 6) Click en el botón "arrow" (id=scrollUp) para ir arriba
    const scrollUp = page.locator('#scrollUp');
    // Aseguramos que aparezca tras el scroll
    await expect(scrollUp).toBeVisible({ timeout: 10_000 });
    await scrollUp.click();

    // Esperamos que el scroll llegue al tope (antiflaky)
    await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 10_000 });

    // 7) Verificar texto del hero
    await expect(
      page.getByRole('heading', { name: /Full-Fledged practice website for Automation Engineers/i })
    ).toBeVisible();
  });
});
