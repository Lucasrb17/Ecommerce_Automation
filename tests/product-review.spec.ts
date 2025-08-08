import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';

test.describe('TC21 - Add review on product', () => {
  test('User writes a review on first product', async ({ page }) => {
    const products = new ProductsPage(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Cerrar modal si estuviera abierto
    const modal = page.locator('#cartModal, .modal:has-text("Added")');
    if (await modal.isVisible().catch(() => false)) {
      await modal.locator('.close, button.close').first().click().catch(() => {});
      await modal.waitFor({ state: 'hidden' }).catch(() => {});
    }

    // Ir a products con selector robusto
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: /products/i }).click();

    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

    // Abrir detalle del primer producto
    await products.viewProductByIndex(0);

    // Rellenar y enviar review
    await page.locator('#name').fill('QA Tester');
    await page.locator('#email').fill('qatester@example.com');
    await page.locator('textarea#review').fill('Great product for testing purposes.');
    await page.locator('#button-review').click();

    // Verificar mensaje de confirmación
    await expect(page.getByText(/thank you for your review/i)).toBeVisible();
  });
});

