import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { validUser } from '../utils/test-data';

test('Usuario logueado realiza una compra completa y hace logout', async ({ page }) => {
  const home = new HomePage(page);
  const login = new LoginPage(page);
  const products = new ProductsPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  // Login
  await home.navigate();
  await home.goToLogin();
  await login.login(validUser.email, validUser.password);
  await home.verifyLoggedIn(validUser.name);

  // Producto 1: Blue Top
  await home.goToProducts();
  await products.verifyLoaded();
  await products.viewProductByIndex(0);
  await products.verifyProductDetail('Blue Top', 'Rs. 500');
  await products.setQuantity(1);
  await products.addToCartAndContinue();

  // Producto 2: Men Tshirt
  await home.goToProducts();
  await products.viewProductBySelector('div:nth-child(4) > .product-image-wrapper > .choose > .nav > li > a');
  await products.verifyProductDetail('Men Tshirt', 'Rs. 400');
  await products.setQuantity(5);
  await products.addToCartAndContinue();

  // Ir al carrito
  await cart.goToCart();
  await cart.verifyTotalPrice('Rs. 2000');
  await cart.proceedToCheckout();

  // Checkout
  await checkout.verifyAddressSections();
  await checkout.placeOrder();
  await checkout.fillPaymentForm();
  await checkout.verifyOrderConfirmation();

  // Logout
  await login.logout();
  await home.goToLogin();
  await login.verifyLoginFormVisible();
});
