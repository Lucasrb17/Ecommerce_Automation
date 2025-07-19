
import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { validUser } from '../utils/test-data';

test.slow(); // Marcar este test como "lento" para evitar timeouts en CI/CD

test('Usuario logueado realiza una compra completa y hace logout', async ({ page }) => {
  const home = new HomePage(page);
  const login = new LoginPage(page);
  const products = new ProductsPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  // --- LOGIN ---
  await home.navigate();
  await home.goToLogin();
  await login.login(validUser.email, validUser.password);
  await home.verifyLoggedIn(validUser.name);

  // --- PRODUCTO 1: Blue Top ---
  await home.goToProducts();
  await products.verifyLoaded();
  await products.viewProductByIndex(0);

  // Esperar el detalle del producto y chequear nombre/precio
  await products.verifyProductDetail('Blue Top', 'Rs. 500');
  await products.setQuantity(1);

  // Mejor práctica: esperar explícitamente el request de agregar al carrito (si hay fetch/XHR)
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/add_to_cart') && resp.status() === 200),
    products.addToCartAndContinue()
  ]);

  // --- PRODUCTO 2: Men Tshirt ---
  await home.goToProducts();
  await products.viewProductBySelector('div:nth-child(4) > .product-image-wrapper > .choose > .nav > li > a');
  await products.verifyProductDetail('Men Tshirt', 'Rs. 400');
  await products.setQuantity(5);

  // Esperar el request de agregar al carrito otra vez (mejor práctica)
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/add_to_cart') && resp.status() === 200),
    products.addToCartAndContinue()
  ]);

  // --- IR AL CARRITO ---
  await cart.goToCart();
  await cart.verifyTotalPrice('Rs. 2000');
  await cart.proceedToCheckout();

  // --- CHECKOUT ---
  await checkout.verifyAddressSections();
  await checkout.placeOrder();
  await checkout.fillPaymentForm();

  // Esperar y verificar la confirmación de la orden
  await checkout.verifyOrderConfirmation();

  // --- LOGOUT ---
  await login.logout();
  await home.goToLogin();
  await login.verifyLoginFormVisible();
});
