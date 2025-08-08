import { expect, Page, Locator } from '@playwright/test';

function parsePrice(text?: string | null): number {
  const n = parseInt((text ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export class ProductsPage {
  constructor(private readonly page: Page) {}

  async goToProducts() {
    await this.page.getByRole('link', { name: /products/i }).click();
    await expect(this.page).toHaveURL(/\/products/);
  }

  async verifyLoaded() {
    await expect(this.page.getByRole('heading', { name: /all products/i })).toBeVisible();
    await expect(this.page.locator('.features_items .product-image-wrapper').first()).toBeVisible();
  }

  async viewProductByIndex(index: number) {
    const viewLinks = this.page.locator('.choose a').filter({ hasText: /view product/i });
    await expect(viewLinks.nth(index)).toBeVisible();
    await viewLinks.nth(index).click();
    await expect(this.page).toHaveURL(/\/product_details\/\d+/);
  }

  async viewProductBySelector(selector: string) {
    await this.page.locator(selector).click();
    await expect(this.page).toHaveURL(/\/product_details\/\d+/);
  }

  async verifyProductDetail(name?: string, priceTextMaybe?: string) {
    await expect(this.page.locator('.product-information')).toBeVisible();
    if (name) await expect(this.page.getByText(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))).toBeVisible();
    if (priceTextMaybe) {
      const safe = priceTextMaybe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(this.page.getByText(new RegExp(safe, 'i'))).toBeVisible();
    }
  }

  async getCurrentProductName(): Promise<string> {
    const candidates: Locator[] = [
      this.page.locator('.product-information h2'),
      this.page.locator('h2.title.text-center'),
      this.page.locator('.product-information h1, h1'),
    ];
    for (const c of candidates) {
      const t = (await c.first().textContent().catch(() => '') || '').trim();
      if (t) return t;
    }
    return '';
  }

  async getCurrentPriceText(): Promise<string> {
    const priceLocators: Locator[] = [
      this.page.locator('.product-information span').filter({ hasText: /Rs\./i }),
      this.page.locator('.product-information p').filter({ hasText: /Rs\./i }),
      this.page.getByText(/Rs\.\s*\d+/i),
    ];
    for (const loc of priceLocators) {
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const t = (await loc.nth(i).textContent().catch(() => '') || '').trim();
        if (/Rs\.\s*\d+/i.test(t)) return t;
      }
    }
    return '';
  }

  async setQuantity(qty: number) {
    const qtyInput = this.page.locator('#quantity, input[name="quantity"]');
    await expect(qtyInput.first()).toBeVisible();
    await qtyInput.first().fill(String(qty));
  }

  async addToCartAndContinue() {
    // Uso en página de detalle: acepta <a> o <button>
    await this.page.locator('a.add-to-cart, button:has-text("Add to cart")').first().click();

    const modal = this.page.locator('#cartModal');
    if (await modal.isVisible().catch(() => false)) {
      const continueBtn = modal.locator('button.close-modal, .modal-footer button').filter({ hasText: /continue shopping/i }).first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click().catch(() => {});
        await modal.waitFor({ state: 'hidden' }).catch(() => {});
      } else {
        await modal.locator('.close, button.close').first().click().catch(() => {});
        await modal.waitFor({ state: 'hidden' }).catch(() => {});
      }
    }
  }

  // === Operaciones desde el listado ===

  async getListProductMetaByIndex(index: number): Promise<{ name: string; unitPriceText: string; unitPrice: number }> {
    const card = this.page.locator('.features_items .product-image-wrapper').nth(index);
    await expect(card).toBeVisible();

    const name = (await card.locator('.productinfo p').first().textContent().catch(() => '') || '').trim();
    const unitPriceText = (await card.locator('.productinfo h2').first().textContent().catch(() => '') || '').trim();
    const unitPrice = parsePrice(unitPriceText);

    return { name, unitPriceText, unitPrice };
  }

  /**
   * Add to cart robusto desde la card sin bucles largos.
   * - Intenta overlay; si no está, usa botón en .productinfo
   * - Espera el modal "Added!" con timeout corto y falla temprano si no aparece
   */
  async addToCartFromListByIndex(index: number, action: 'continue' | 'viewCart' = 'continue') {
    const card = this.page.locator('.features_items .product-image-wrapper').nth(index);
    await expect(card).toBeVisible();

    // Garantizar que la card está a la vista y habilitar overlay
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await card.locator('.single-products').hover().catch(() => {});

    const overlayAdd = card.locator('.product-overlay .overlay-content a.add-to-cart').first();
    const infoAdd = card.locator('.productinfo a.add-to-cart').first();
    const modal = this.page.locator('#cartModal');

    // Click único con fallback, sin reintentos largos
    if (await overlayAdd.isVisible().catch(() => false)) {
      await overlayAdd.click();
    } else {
      await infoAdd.click();
    }

    // Espera del modal con timeout acotado; si no aparece, lanzar error claro
    await expect(modal, 'No apareció el modal "Added!" tras hacer Add to cart').toBeVisible({ timeout: 5000 });

    if (action === 'continue') {
      const continueBtn = modal.locator('button.close-modal, .modal-footer button').filter({ hasText: /continue shopping/i }).first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click().catch(() => {});
      } else {
        await modal.locator('.close, button.close').first().click().catch(() => {});
      }
      await modal.waitFor({ state: 'hidden' }).catch(() => {});
    } else {
      const viewCart = modal.locator('.modal-body a').filter({ hasText: /view cart/i }).first();
      if (await viewCart.isVisible().catch(() => false)) {
        await Promise.all([
          this.page.waitForURL(/\/view_cart/),
          viewCart.click(),
        ]);
      } else {
        await modal.locator('.close, button.close').first().click().catch(() => {});
        await modal.waitFor({ state: 'hidden' }).catch(() => {});
        await Promise.all([
          this.page.waitForURL(/\/view_cart/),
          this.page.getByRole('link', { name: /cart/i }).first().click(),
        ]);
      }
    }
  }
}

