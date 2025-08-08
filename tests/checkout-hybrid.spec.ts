import { test, expect } from './fixtures';

async function clickFirstVisible(page, locators) {
  for (const l of locators) {
    const el = l.first();
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      return true;
    }
  }
  return false;
}

test.describe('Checkout logueado (UI + API, aislado)', () => {
  test('agrega producto y hace proceed to checkout', async ({ page, loginUI }) => {
    await loginUI();

    // Ir a Products y agregar el primer producto
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

    // Abrir detalle del primer producto y agregar al carrito
    await page.locator('.choose a:has-text("View Product")').first().click();
    await expect(page).toHaveURL(/\/product_details\/\d+/);

    // Asegurar cantidad 1 y agregar
    const qty = page.locator('#quantity, input[name="quantity"]').first();
    if (await qty.isVisible().catch(() => false)) {
      await qty.fill('1');
    }
    await page.getByRole('button', { name: /add to cart/i }).first().click();

    // Cerrar modal "Added!" o ir a "View Cart"
    const modal = page.locator('#cartModal, .modal:has-text("Added")');
    if (await modal.isVisible().catch(() => false)) {
      const viewCart = modal.getByRole('link', { name: /view cart/i });
      const continueBtn = modal.getByRole('button', { name: /continue shopping/i });

      if (await viewCart.isVisible().catch(() => false)) {
        await viewCart.click();
      } else if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await modal.waitFor({ state: 'hidden' }).catch(() => {});
        await page.getByRole('link', { name: /cart|view cart/i }).first().click();
      } else {
        await modal.locator('.close, button.close').first().click().catch(() => {});
        await modal.waitFor({ state: 'hidden' }).catch(() => {});
        await page.getByRole('link', { name: /cart|view cart/i }).first().click();
      }
    } else {
      // Si no hubo modal, ir al cart desde el header
      await page.getByRole('link', { name: /cart|view cart/i }).first().click();
    }

    await expect(page).toHaveURL(/\/view_cart/);

    // Evitar strict mode violation: validar uno de los contenedores del carrito
    const cartInfo = page.locator('#cart_info');
    const cartItems = page.locator('#cart_items');
    if (await cartInfo.count()) {
      await expect(cartInfo).toBeVisible();
    } else {
      await expect(cartItems).toBeVisible();
    }

    // Proceed to checkout con navegación garantizada y variantes de selector
    const candidates = [
      page.getByRole('link', { name: /proceed to checkout/i }),
      page.getByRole('button', { name: /proceed to checkout/i }),
      page.locator('a, button').filter({ hasText: /proceed to checkout/i }),
      page.locator('a, button').filter({ hasText: /^checkout$/i }),
    ];

    let clicked = false;
    for (const c of candidates) {
      const el = c.first();
      if (await el.isVisible().catch(() => false)) {
        await Promise.all([
          page.waitForURL(/\/checkout|\/payment|\/login|\/payment_details|\/address/i, { timeout: 15000 }).catch(() => {}),
          el.click(),
        ]);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // Fallback: intenta dentro de áreas comunes de navegación del carrito
      const alt = [
        page.locator('.cart_navigation a.button, .cart_navigation button').filter({ hasText: /checkout/i }),
        page.locator('.btn').filter({ hasText: /checkout/i }),
      ];
      for (const a of alt) {
        const el = a.first();
        if (await el.isVisible().catch(() => false)) {
          await Promise.all([
            page.waitForURL(/\/checkout|\/payment|\/login|\/payment_details|\/address/i, { timeout: 15000 }).catch(() => {}),
            el.click(),
          ]);
          clicked = true;
          break;
        }
      }
    }

    // Aceptar varias vistas válidas post-checkout para robustez
    const possibleAssertions = [
      page.getByRole('heading', { name: /checkout/i }),
      page.getByText(/address details/i),
      page.getByText(/review your order/i),
      page.locator('#address_delivery, #address_delivery1'), // variantes de bloque de dirección
    ];

    // Espera a que al menos una condición sea verdadera
    let anyVisible = false;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && !anyVisible) {
      for (const loc of possibleAssertions) {
        if (await loc.first().isVisible().catch(() => false)) {
          anyVisible = true;
          break;
        }
      }
      if (!anyVisible) await page.waitForTimeout(300);
    }

    expect(anyVisible, 'No se encontró una vista válida de Checkout/Address/Review luego de proceder al checkout').toBeTruthy();
  });
});


