import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';

test.describe('Cart - Guest add to cart (resilient)', () => {
  test('Add first product to cart as guest and reach checkout gate', async ({ page }) => {
    const home = new HomePage(page);
    const products = new ProductsPage(page);
    const cart = new CartPage(page);

    // Home → Products (garantizamos estado guest si quedó sesión)
    await home.navigate();
    if (typeof (home as any).ensureGuest === 'function') {
      await (home as any).ensureGuest(); // no falla si ya es guest
    }
    if (typeof (home as any).goToProducts === 'function') {
      await (home as any).goToProducts();
    } else {
      // Fallback por si tu HomePage viejo no tiene goToProducts()
      await page.locator('a[href="/products"]').first().click();
    }

    // Listado cargado y abrimos el primer detalle de producto
    await products.verifyLoaded();
    const product = await products.openFirstProductDetail(); // devuelve { name, unitPrice }

    // Seteamos cantidad de forma idempotente
    await products.setQuantity(1);

    // Add to cart y cerrar modal/toast (tolerante)
    await products.addToCartAndContinue();

    // Abrir carrito y validar línea (por nombre capturado y qty)
    if (typeof (cart as any).openCart === 'function') {
      await (cart as any).openCart();
    } else {
      // Fallback si tu CartPage viejo no tiene openCart()
      await page.locator('a[href="/view_cart"]').first().click();
    }

    await cart.verifyLineItem({ nameContains: product.name, quantity: 1 });

    // Ir a checkout y aceptar dos finales válidos (gate guest o checkout)
    if (typeof (cart as any).proceedToCheckout === 'function') {
      await (cart as any).proceedToCheckout();
    } else {
      await page.getByText('Proceed To Checkout').first().click();
    }

    await cart.verifyCheckoutGateOrPage();
  });
});

