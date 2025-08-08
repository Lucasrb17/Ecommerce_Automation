// tests/advanced-cart-multiuser.spec.ts
import { test, expect } from '@playwright/test';

// PNG transparente 1x1 para stub de imágenes
const ONE_BY_ONE_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

test.describe('Advanced E2E - Mock + Multiusuario + Cart aislado', () => {
  test('Usuario A agrega al carrito; Usuario B NO lo ve', async ({ page, browser, baseURL }) => {
    // --------- Setup: stub de imágenes de productos (mock de red) ---------
    await page.route('**/get_product_picture/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(ONE_BY_ONE_PNG, 'base64'),
      });
    });

    // 1-2) Home
    await page.goto(baseURL ?? 'http://automationexercise.com', { waitUntil: 'domcontentloaded' });

    // 3) Ir a Products con locator estable (header menu)
    await page.getByRole('link', { name: /products/i }).click();

    // 4) Verificar ALL PRODUCTS
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

    // 5) Tomar el PRIMER producto: nombre + click "Add to cart"
    const firstCard = page.locator('.features_items .product-image-wrapper').first();

    // Nombre del producto (el <p> dentro de .productinfo)
    const productName = (await firstCard.locator('.productinfo p').first().textContent())?.trim() || '';
    expect(productName).not.toEqual('');

    // Click en "Add to cart" del primer card
    await firstCard.locator('.productinfo .add-to-cart').first().click();

    // 6) Verificar modal "Added!" y cerrar (Continue Shopping)
    const modal = page.locator('#cartModal .modal-content');
    await expect(modal.getByRole('heading', { name: /added!/i })).toBeVisible();
    await modal.getByRole('button', { name: /continue shopping/i }).click();
    await expect(modal).toBeHidden();

    // Ir al Cart desde el header
    await page.getByRole('link', { name: /cart/i }).click();
    await expect(page).toHaveURL(/\/view_cart$/);

    // 7) Validar que el producto agregado esté listado en el carrito
    await expect(page.getByText(productName, { exact: false })).toBeVisible();

    // ----------------- Nuevo contexto: Usuario B -----------------
    const contextB = await browser.newContext(); // storage aislado
    const pageB = await contextB.newPage();

    // Stub de imágenes también para B (mismo objetivo: velocidad/consistencia)
    await pageB.route('**/get_product_picture/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(ONE_BY_ONE_PNG, 'base64'),
      });
    });

    await pageB.goto(baseURL ?? 'http://automationexercise.com', { waitUntil: 'domcontentloaded' });
    await pageB.getByRole('link', { name: /cart/i }).click();
    await expect(pageB).toHaveURL(/\/view_cart$/);

    // 8) Asegurar que el carrito del Usuario B NO contiene el producto de A
    await expect(pageB.getByText(productName, { exact: false })).toHaveCount(0);

    await contextB.close();
  });
});
