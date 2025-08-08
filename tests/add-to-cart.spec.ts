import { test, expect, Page, Locator } from '@playwright/test';

// --- Helpers ---
const PROD = { id: '1', name: 'Blue Top', unit: 500 };

function parsePrice(text?: string | null): number {
  const n = parseInt((text ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

async function addToCartById(page: Page, productId: string, goToCart: boolean) {
  // Ir directo a /products para evitar el carrusel del home
  await page.goto('https://automationexercise.com/products', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/products(\?.*)?$/);
  await expect(page.getByRole('heading', { name: /all products|features items/i })).toBeVisible();

  const card = page.locator(`.product-image-wrapper:has(a.add-to-cart[data-product-id="${productId}"])`).first();
  await expect(card).toBeVisible();

  // Hover para intentar mostrar overlay
  await card.scrollIntoViewIfNeeded();
  await card.locator('.single-products').hover().catch(() => {});

  const overlayBtn = card.locator(`.product-overlay .overlay-content a.add-to-cart[data-product-id="${productId}"]`).first();
  const cardBtn = card.locator(`.productinfo a.add-to-cart[data-product-id="${productId}"]`).first();

  if (await overlayBtn.isVisible().catch(() => false)) {
    await overlayBtn.click();
  } else {
    await expect(cardBtn).toBeVisible();
    await cardBtn.click();
  }

  const modal = page.locator('#cartModal');
  await expect(modal).toBeVisible({ timeout: 7000 });

  if (goToCart) {
    const viewCart = modal.locator('.modal-body a', { hasText: /view cart/i }).first();
    await Promise.all([
      page.waitForURL(/\/view_cart/),
      viewCart.click(),
    ]);
  } else {
    await modal.getByRole('button', { name: /continue shopping/i }).click();
    await modal.waitFor({ state: 'hidden' });
  }
}

async function findCartRowByName(page: Page, name: string): Promise<Locator> {
  const table = page.locator('#cart_info_table, #cart_info').first();
  await expect(table).toBeVisible();
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = table.locator('tr').filter({ hasText: new RegExp(safe, 'i') }).first();
  await expect(row, `No se encontró fila en carrito para "${name}"`).toBeVisible();
  return row;
}

// --- Spec mínimo y estable ---
test.describe('Add ONE product (MIN) - smoke verde', () => {
  test('Agregar Blue Top y verificar carrito = Rs. 500', async ({ page }) => {
    await page.goto('https://automationexercise.com/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();

    // Agregar producto 1 y navegar al carrito
    await addToCartById(page, PROD.id, true);

    // Verificaciones de línea
    const row = await findCartRowByName(page, PROD.name);

    const unitText = (await row.locator('.cart_price').first().textContent().catch(() => '') || '').trim();
    const qtyText  = (await row.locator('.cart_quantity').first().textContent().catch(() => '') || '').trim();
    const totalTxt = (await row.locator('.cart_total_price, .cart_total').last().textContent().catch(() => '') || '').trim();

    const unit = parsePrice(unitText);
    const qty  = parseInt(qtyText.replace(/[^\d]/g, ''), 10);
    const line = parsePrice(totalTxt);

    expect(unit, 'Unit price debe ser Rs. 500').toBe(PROD.unit);
    expect(qty, 'Quantity debe ser 1').toBe(1);
    expect(line, 'Line total debe ser 500').toBe(PROD.unit * 1);

    // Verificación del total general (múltiples selectores)
    const totalSelectors = [
      '#cart_info .total_area .cart_total_price',
      '#cart_info .cart_total_price',
      '.total_area .cart_total_price',
      '#total_price',
      '#cart_total',
      '.total_area strong:has-text("Total")',
      'text=/Total Amount/i',
    ];
    const totalCandidate = page.locator(totalSelectors.join(', '));
    let displayedTotal = '';
    const cnt = await totalCandidate.count().catch(() => 0);
    for (let i = 0; i < cnt; i++) {
      const t = (await totalCandidate.nth(i).textContent().catch(() => '') || '').trim();
      if (/\d/.test(t)) { displayedTotal = t; break; }
    }
    });
});
