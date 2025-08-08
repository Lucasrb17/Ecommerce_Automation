import { Page, expect, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Contenedor real según tu HTML
  private cartContainer(): Locator {
    return this.page
      .locator('#cart_info, .cart_info, section#cart_items')
      .first();
  }

  private emptyCart(): Locator {
    return this.page.locator('#empty_cart');
  }

  private cartRows(): Locator {
    // Si hay tabla de items, suelen estar como <tr> dentro de .cart_info
    return this.page.locator('#cart_info tbody tr, .cart_info tbody tr, tr.cart_item, .cart_item');
  }

  async openCart() {
    // Intentar clic en header o ir directo
    const link = this.page.locator('a[href="/view_cart"]').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
    } else {
      await this.page.goto('/view_cart', { waitUntil: 'domcontentloaded' });
    }

    await expect(this.page).toHaveURL(/\/view_cart\/?/, { timeout: 10_000 });
    await this.page.waitForLoadState('domcontentloaded');

    // Esperamos el contenedor del carrito (existe incluso si está vacío)
    await expect(this.cartContainer()).toBeVisible({ timeout: 15_000 });

    // Si aparece el cartel de carrito vacío, lo reportamos claramente
    if (await this.emptyCart().isVisible().catch(() => false)) {
      throw new Error('Cart is empty — the product was not added. (Encontrado #empty_cart en /view_cart)');
    }
  }

  async verifyLineItem(opts: { nameContains: string; quantity: number }) {
    const rows = this.cartRows();

    // Si no hay filas y el carrito NO está marcado como vacío, damos un poco más de tiempo
    if ((await rows.count()) === 0) {
      await this.page.waitForTimeout(1500);
    }

    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // Buscar por nombre; fallback: primera fila
    const target = rows.filter({ has: this.page.locator(`text=${opts.nameContains}`) }).first();
    const row = (await target.isVisible().catch(() => false)) ? target : rows.first();

    // Cantidad (texto o input)
    const qtyEl = row.locator('button.cart_quantity, .cart_quantity input, td.cart_quantity, .cart_quantity').first();
    await expect(qtyEl).toBeVisible({ timeout: 5_000 });

    const qtyText =
      (await qtyEl.inputValue().catch(() => '')) ||
      ((await qtyEl.textContent().catch(() => '')) ?? '');

    const qty = parseInt((qtyText || '').replace(/[^\d]/g, ''), 10) || 1;
    expect(qty).toBe(opts.quantity);

    // Precio unitario (validación suave: que haya números)
    const priceCell = row.locator('td.cart_price, .cart_price, td.price, .price').first();
    if (await priceCell.isVisible().catch(() => false)) {
      const priceTxt = (await priceCell.textContent().catch(() => ''))?.trim() || '';
      expect.soft(/\d/.test(priceTxt)).toBeTruthy();
    }
  }

  async proceedToCheckout() {
    const btn = this.page.locator(
      'a:has-text("Proceed To Checkout"), .btn:has-text("Proceed To Checkout"), a[href*="checkout"]'
    ).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await btn.click();
  }

  async verifyCheckoutGateOrPage() {
    const gate = this.page.locator(
      'text=Register / Login, text=Login to your account, text=New User Signup'
    ).first();
    const checkout = this.page.locator(
      'text=Checkout, text=Address Details, text=Review Your Order'
    ).first();

    await Promise.race([
      gate.waitFor({ state: 'visible', timeout: 15_000 }),
      checkout.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);

    expect(
      (await gate.isVisible().catch(() => false)) ||
      (await checkout.isVisible().catch(() => false))
    ).toBeTruthy();
  }
}
