import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';

test('Agregar producto al carrito sin estar logueado', async ({ page }) => {
  const home = new HomePage(page);
  const products = new ProductsPage(page);
  const cart = new CartPage(page);

  await home.navigate();
  await home.goToProducts();

  await products.verifyLoaded();
  await products.viewFirstProduct();
  await products.verifyProductDetail('Blue Top', 'Rs. 500'); // <- así va bien


  await products.setQuantity(1); // O 2 si querés testear más cantidad
  await products.addToCart();
  await products.continueShopping();

  await cart.openCart();
  await cart.verifyProductInCart('Blue Top');
  await cart.proceedToCheckout();
  await cart.verifyGuestCheckoutPrompt();
});
