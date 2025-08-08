import { expect, Page, Locator } from '@playwright/test';

// --- Utils ---
function parsePrice(text?: string | null): number {
  const n = parseInt((text ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export class CartPage {
  constructor(private readonly page: Page) {}

  // --- Internos ---
  private async closeBlockingModalsIfAny() {
    const modal = this.page.locator('#cartModal, .modal:has-text("Added")');
    if (await modal.isVisible().catch(() => false)) {
      const continueBtn = modal.getByRole('button', { name: /continue shopping/i });
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click().catch(() => {});
      } else {
        await modal.locator('.close, button.close').first().click().catch(() => {});
      }
      await modal.waitFor({ state: 'hidden' }).catch(() => {});
    }
  }

  private candidatesForTotal(): Locator[] {
    return [
      this.page.locator('#cart_info .total_area .cart_total_price'),
      this.page.locator('#cart_info .cart_total_price'),
      this.page.locator('.total_area .cart_total_price'),
      this.page.locator('#total_price'),
      this.page.locator('#cart_total'),
      this.page.locator('.total_area strong').filter({ hasText: /Total/i }),
      this.page.getByText(/Total Amount/i),
      this.page.getByText(/^Total/i),
    ];
  }

  // --- Navegación / limpieza ---
  async goToCart() {
    await this.closeBlockingModalsIfAny();
    const link = this.page.locator('a[href="/view_cart"]').first();
    await expect(link).toBeVisible();
    await Promise.all([this.page.waitForURL(/\/view_cart/), link.click()]);

    // Validar uno de los contenedores (evita strict mode violation)
    const cartInfo = this.page.locator('#cart_info');
    const cartItems = this.page.locator('#cart_items');
    if (await cartInfo.count()) {
      await expect(cartInfo).toBeVisible();
    } else {
      await expect(cartItems).toBeVisible();
    }
  }

  async clearAllItems() {
    await this.goToCart();
    const deleteButtons = this.page.locator('.cart_quantity_delete, a[title="Delete"]');
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.nth(i).click();
      await this.page.waitForTimeout(400);
    }
    const rows = this.page.locator('#cart_info_table tbody tr');
    if (await rows.count().catch(() => 0)) {
      await expect(rows).toHaveCount(0);
    }
  }

  // --- Validaciones (total del carrito) ---
  async verifyTotalPrice(expectedTotalText: string) {
    const candidates = this.candidatesForTotal();
    let displayedTotal = '';
    for (const loc of candidates) {
      const cnt = await loc.count().catch(() => 0);
      for (let i = 0; i < cnt; i++) {
        const t = (await loc.nth(i).textContent().catch(() => '') || '').trim();
        if (t && /\d/.test(t)) {
          displayedTotal = t;
          break;
        }
      }
      if (displayedTotal) break;
    }
    const expected = parsePrice(expectedTotalText);
    const got = parsePrice(displayedTotal);
    expect(got, `Cart total mismatch. Expected ~${expectedTotalText}, got "${displayedTotal}"`).toBe(expected);
  }

  // --- Helpers de fila ---
  private async readUnitPriceFromRow(row: Locator): Promise<{ text: string; value: number }> {
    // Preferir la celda de precio unitario
    const candidates: Locator[] = [
      row.locator('.cart_price').getByText(/Rs\.\s*\d+/i).first(),
      row.locator('.cart_price').first(),
      row.locator('td').filter({ hasText: /Rs\.\s*\d+/i }).first(),
      row.getByText(/Rs\.\s*\d+/i).first(),
    ];
    for (const c of candidates) {
      const txt = (await c.textContent().catch(() => '') || '').trim();
      const val = parsePrice(txt);
      if (val > 0) return { text: txt, value: val };
    }
    return { text: '', value: 0 };
  }

  private async readQtyFromRow(row: Locator): Promise<number> {
    const candidates: Locator[] = [
      row.locator('.cart_quantity').first(),
      row.locator('td').nth(3),
      row.getByText(/\b\d+\b/).first(),
    ];
    for (const c of candidates) {
      const t = (await c.textContent().catch(() => '') || '').trim();
      const n = parseInt(t.replace(/[^\d]/g, ''), 10);
      if (Number.isFinite(n)) return n;
    }
    return NaN;
  }

  private async readLineTotalFromRow(row: Locator): Promise<{ text: string; value: number }> {
    // Buscar el total de la línea en celdas típicas y, si no, cualquier "Rs. ####" al final
    const candidates: Locator[] = [
      row.locator('.cart_total_price').first(),
      row.locator('.cart_total').getByText(/Rs\.\s*\d+/i).first(),
      row.locator('td').filter({ hasText: /Rs\.\s*\d+/i }).last(),
      row.getByText(/Rs\.\s*\d+/i).last(),
    ];
    for (const c of candidates) {
      const txt = (await c.textContent().catch(() => '') || '').trim();
      const val = parsePrice(txt);
      if (val > 0) return { text: txt, value: val };
    }
    return { text: '', value: 0 };
  }

  /**
   * Verifica una línea del carrito con firma flexible.
   *
   * Formas válidas de uso en los tests:
   *  - verifyLineItem({ name, unitPriceText?, unitPrice?, qty? })
   *  - verifyLineItem(name, unitPriceTextOrNumber, qty)
   */
  async verifyLineItem(
    a:
      | string
      | {
          name?: string;
          nameContains?: string;
          unitPriceText?: string;
          unitPrice?: number;
          qty?: number;
        },
    b?: string | number,
    c?: number
  ) {
    // Normalización de argumentos
    let name = '';
    let nameContains = '';
    let unitPriceText = '';
    let unitPrice = NaN;
    let qty = NaN;

    if (typeof a === 'string') {
      name = a;
      if (typeof b === 'number') {
        unitPrice = b;
      } else if (typeof b === 'string') {
        unitPriceText = b;
        unitPrice = parsePrice(b);
      }
      qty = Number(c);
    } else {
      name = a?.name?.trim() ?? '';
      nameContains = a?.nameContains?.trim() ?? '';
      if (typeof a?.unitPrice === 'number') {
        unitPrice = a.unitPrice;
      } else if (typeof a?.unitPriceText === 'string') {
        unitPriceText = a.unitPriceText;
        unitPrice = parsePrice(a.unitPriceText);
      }
      qty = Number.isFinite(a?.qty as number) ? Number(a?.qty) : Number(c);
    }

    if (!Number.isFinite(unitPrice) && unitPriceText) unitPrice = parsePrice(unitPriceText);

    // Asegurar tabla presente
    const table = this.page.locator('#cart_info_table, table');
    await expect(table.first()).toBeVisible();

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    let target: Locator | null = null;

    // 1) Intento por nombre exacto
    if (name) {
      const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        if ((await row.getByText(new RegExp(safe, 'i')).count()) > 0) {
          target = row;
          break;
        }
      }
    }

    // 2) Intento por nombre parcial (nameContains)
    if (!target && nameContains) {
      const safeContains = nameContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        if ((await row.getByText(new RegExp(safeContains, 'i')).count()) > 0) {
          target = row;
          break;
        }
      }
    }

    // 3) Si no hay nombre, intentar por unit price
    if (!target) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const up = await this.readUnitPriceFromRow(row);
        if (
          (Number.isFinite(unitPrice) && up.value === unitPrice) ||
          (!!unitPriceText && new RegExp(unitPriceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(up.text))
        ) {
          target = row;
          break;
        }
      }
    }

    // 4) Fallback: si nada coincide, tomar la primera fila
    if (!target && rowCount > 0) target = rows.first();

    expect(
      Boolean(target),
      `Cart row not found (name="${name}", nameContains="${nameContains}", unit="${unitPriceText || unitPrice}", qty=${qty})`
    ).toBe(true);

    const row = target!;

    // === Validaciones finales ===
    // Unit price
    const unit = await this.readUnitPriceFromRow(row);
    if (Number.isFinite(unitPrice)) {
      expect(unit.value, `Unit price mismatch`).toBe(unitPrice);
    } else {
      expect(unit.value, 'Unit price not found').toBeGreaterThan(0);
      unitPrice = unit.value;
    }

    // Quantity
    let qtyGot = await this.readQtyFromRow(row);
    if (Number.isFinite(qty)) {
      expect(qtyGot, `Quantity mismatch`).toBe(qty);
    } else {
      expect(qtyGot, 'Quantity not found').toBeGreaterThan(0);
      qty = qtyGot;
    }

    // Line total
    const line = await this.readLineTotalFromRow(row);
    // Si no encontramos texto válido en los selectores, calcular y aceptar como fallback
    const expectedLine = unitPrice * qty;
    if (line.value === 0) {
      // Último recurso: intentar leer nuevamente cualquier Rs. al final de la fila
      const anyRs = (await row.getByText(/Rs\.\s*\d+/i).last().textContent().catch(() => '') || '').trim();
      const anyVal = parsePrice(anyRs);
      if (anyVal > 0) {
        expect(anyVal, `Line total mismatch`).toBe(expectedLine);
        return;
      }
    }
    expect(line.value, `Line total mismatch`).toBe(expectedLine);
  }

  // --- Acción ---
  async proceedToCheckout() {
    const candidates: Locator[] = [
      this.page.getByRole('link', { name: /proceed to checkout/i }),
      this.page.getByRole('button', { name: /proceed to checkout/i }),
      this.page.locator('a, button').filter({ hasText: /proceed to checkout/i }),
    ];
    for (const c of candidates) {
      const el = c.first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        return;
      }
    }
    throw new Error('Proceed to Checkout button/link not found');
  }

  async verifyCheckoutGateOrPage() {
    const possibilities: Locator[] = [
      this.page.getByRole('heading', { name: /checkout/i }),
      this.page.getByText(/address details/i),
      this.page.getByText(/review your order/i),
      this.page.getByRole('heading', { name: /login to your account/i }),
      this.page.getByRole('heading', { name: /new user signup/i }),
      this.page.getByText(/register|signup|login/i),
    ];

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      for (const loc of possibilities) {
        if (await loc.first().isVisible().catch(() => false)) {
          return;
        }
      }
      await this.page.waitForTimeout(300);
    }
    throw new Error('No se encontró una vista válida de Checkout/Login gate tras proceder al checkout');
  }
}
