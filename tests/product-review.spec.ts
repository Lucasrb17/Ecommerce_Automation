// tests/product-review.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TC21 - Add review on product', () => {
  test('User writes a review on first product', async ({ page, baseURL }) => {
    // 1-2) Launch + Navigate
    await page.goto(baseURL ?? 'http://automationexercise.com', { waitUntil: 'domcontentloaded' });

    // 3) Click on 'Products' (header link)
    await page.getByRole('link', { name: /products/i }).click();

    // 4) Verify ALL PRODUCTS page
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

    // 5) Click on 'View Product' button of the first item
    await page
      .locator('.features_items .product-image-wrapper .choose a:has-text("View Product")')
      .first()
      .click();

    // Verify navigated to product details
    await expect(page).toHaveURL(/\/product_details\/\d+$/);

    // 6) Verify 'Write Your Review' is visible (it's a LINK, not role=tab)
    const reviewTabLink = page.getByRole('link', { name: /write your review/i });
    await expect(reviewTabLink).toBeVisible();
    await reviewTabLink.click(); // optional; pane is active by default

    // Ensure the review form is visible
    const reviewForm = page.locator('#review-form');
    await expect(reviewForm).toBeVisible();

    // 7) Enter name, email and review
    await page.fill('#name', 'Lucas QA');
    await page.fill('#email', 'lucas.qa+review@example.com');
    await page.fill('#review', 'Excelente calidad, llegó a tiempo y coincide con la descripción.');

    // 8) Click 'Submit'
    await page.click('#button-review');

    // 9) Verify success message appears (it hides after ~2s)
    const successAlert = page.locator(
      '#review-section .alert-success.alert >> text=Thank you for your review.'
    );
    await successAlert.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(successAlert).toBeVisible();
  });
});
