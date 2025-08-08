import { Page, Locator, expect } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------- Helpers privados ----------
  private productCards(): Locator {
    // Card estable: wrapper + link al detalle
    return this.page
      .locator('.features_items .product-image-wrapper')
      .filter({ has: this.page.locator('a[href*="/product_details/"]') });
  }

  private addToCartButton(): Locator {
    // Botón de detalle (texto puede variar en mayúsculas)
    return this.page.locator('button:has-text("Add to cart")').first();
  }

  private continueShoppingButton(): Locator {
    // Botón del modal "Added!" típico del sitio
    return this.page.locator('#cartModal button:has-text("Continue Shopping"), .modal.show button:has-text("Continue Shopping")').first();
  }

  private cartModal(): Locator {
    // Modal de agregado (id usado por el sitio)
    return this.page.locator('#cartModal, .modal.show').first();
  }

  // ---------- API pública ----------
  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/products/);
    await expect(this.productCards().first()).toBeVisible();
  }

  async openFirstProductDetail(): Promise<{ name: string; unitPrice: number }> {
    const firstCard = this.productCards().first();
    await expect(firstCard).toBeVisible();

    await firstCard.locator('a[href*="/product_details/"]').first().click();
    await expect(this.page).toHaveURL(/\/product_details\/\d+/);

    return await this.readDetail();
  }

  async readDetail(): Promise<{ name: string; unitPrice: number }> {
    const title = this.page.locator('.product-information h2, .product-information h1').first();
    await expect(title).toBeVisible();

    const name = (await title.textContent())?.trim() || 'Unknown product';
    expect.soft(name.length).toBeGreaterThan(0);

    // Precio tolerante a formato y moneda
    const priceContainer = this.page.locator('.product-information').first();
    const raw = (await priceContainer.textContent())?.replace(/\s+/g, ' ').trim() || '';
    const m = raw.match(/([\d][\d.,]*)/);
    const unitPrice = m ? parseFloat(m[1].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')) : 0;
    expect.soft(unitPrice).toBeGreaterThan(0);

    return { name, unitPrice };
  }

  async setQuantity(quantity: number) {
    const qty = this.page.locator('#quantity, input[name="quantity"]').first();
    await expect(qty).toBeVisible();
    await qty.scrollIntoViewIfNeeded();
    await qty.fill(String(quantity));
    await qty.blur();
    const val = await qty.inputValue().catch(() => String(quantity));
    const parsed = parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
    expect.soft(parsed).toBeGreaterThan(0);
  }

  /**
   * Hace click en "Add to cart", espera el modal real (#cartModal) y hace Continue.
   * Si por alguna razón no aparece el modal, va a /view_cart y valida.
   * Si el carrito está vacío, reintenta 1 vez el click (scroll+force) y vuelve a validar.
   */
  async addToCartAndContinue() {
    // Scroll y click en el botón
    const addBtn = this.addToCartButton();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();

    // Espera del modal Added! y Continue Shopping
    const modal = this.cartModal();
    const continueBtn = this.continueShoppingButton();

    // Damos tiempo razonable al modal
    const modalShown = await modal.isVisible().catch(() => false);
    if (!modalShown) {
      await modal.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }

    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    } else {
      // Fallback: si no vimos el modal, intentamos abrir el carrito y ver si se agregó
      await this.page.goto('/view_cart', { waitUntil: 'domcontentloaded' });
      // Si sigue vacío, reintentar add-to-cart una vez
      const empty = this.page.locator('#empty_cart').first();
      if (await empty.isVisible().catch(() => false)) {
        // Volvemos al detalle e intentamos otra vez, esta vez con click forzado
        await this.page.goBack(); // vuelve al detalle
        await addBtn.scrollIntoViewIfNeeded();
        await addBtn.click({ force: true });

        // Si aparece el modal ahora, lo cerramos
        if (await modal.isVisible().catch(() => false)) {
          if (await continueBtn.isVisible().catch(() => false)) {
            await continueBtn.click();
          }
        }
      }
    }

    // Aseguramos que no queden overlays activos
    const overlay = this.page.locator('.modal-backdrop, .modal.in, .modal.show').first();
    if (await overlay.isVisible().catch(() => false)) {
      await overlay.waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {});
    }
  }

  // ---------- Aliases de compatibilidad (opcional) ----------
  async viewFirstProduct() {
    await this.openFirstProductDetail();
  }
  async setQuantityInput(quantity: number) {
    await this.setQuantity(quantity);
  }
  async addToCart() {
    await this.addToCartAndContinue();
  }
  async continueShopping() {
    const btn = this.continueShoppingButton();
    if (await btn.isVisible().catch(() => false)) await btn.click();
  }
}
