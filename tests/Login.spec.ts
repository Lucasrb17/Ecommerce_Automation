import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { validUser, invalidUser } from '../utils/test-data';
import { verifyLoginAPI, verifyLoginWithoutEmail } from '../utils/api';

test('Login incorrecto y luego login correcto con logout + verificación API', async ({ page }) => {
  const home = new HomePage(page);
  const login = new LoginPage(page);

  // --- Validar API: usuario válido
  const validResponse = await verifyLoginAPI(validUser.email, validUser.password);
  expect(validResponse.status).toBe(200);
  expect(validResponse.body).toContain('User exists!');

  // --- Validar API: falta email
  //const invalidResponse = await verifyLoginWithoutEmail(validUser.password);
  //expect(invalidResponse.status).toBe(400);
  //expect(invalidResponse.body).toContain('Bad request, email or password parameter is missing');

  // --- Ir al login
  await home.navigate();
  await home.goToLogin();

  // Login fallido
  await login.fillLoginForm(invalidUser.email, invalidUser.password);
  await login.submitLogin();
  await login.verifyLoginError();

  // Login exitoso
  await login.fillLoginForm(validUser.email, validUser.password);
  await login.submitLogin();
  await login.verifyLoginSuccess(validUser.name);

  // Logout
  await login.logout();

  // Confirmación de logout
  await home.goToLogin();
  
});
