// tests/login-generate-presentation.e2e.spec.ts
import { test, expect, request } from '@playwright/test';

test.describe('Full end-to-end flow: Login and generate presentation (adaptado a automationexercise.com)', () => {
  test.setTimeout(120_000);

  test('Login via UI con usuario creado por API y verificación de sesión', async ({ page }) => {
    // ---- Crear usuario por API (aislado para este test) ----
    const api = await request.newContext({ baseURL: 'https://automationexercise.com' });
    const suffix = Date.now() + '-' + Math.random().toString(16).slice(2);
    const email = `qa.${suffix}@example.com`;
    const password = 'Secret.123!';
    const name = 'QA Bot';

    await api.post('/api/createAccount', {
      form: {
        name,
        email,
        password,
        title: 'Mr',
        birth_date: '1',
        birth_month: '1',
        birth_year: '1990',
        firstname: 'QA',
        lastname: 'Bot',
        company: 'Demo',
        address1: 'Street 123',
        address2: '-',
        country: 'United States',
        zipcode: '10001',
        state: 'NY',
        city: 'NY',
        mobile_number: '1111111111',
      },
    }).catch(() => { /* si ya existe por cualquier motivo, continuar */ });

    // ---- Bloquear ruido/ads para estabilidad ----
    await page.route('**/*', (route) => {
      const url = route.request().url();
      const noisy = [
        'googlesyndication.com',
        'doubleclick.net',
        'google-analytics',
        'youtube',
        'ytimg.com',
        'facebook',
      ];
      if (noisy.some((d) => url.includes(d))) return route.abort();
      return route.continue();
    });

    try {
      // ---- Ir directo al login ----
      await page.goto('https://automationexercise.com/login', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /login to your account/i })).toBeVisible({ timeout: 15_000 });

      // ---- Scope al formulario de login según HTML real ----
      const loginForm = page.locator('div.login-form form[action="/login"]').first();

      // Campos únicos dentro del scope (evita strict mode)
      await loginForm.locator('input[data-qa="login-email"]').fill(email);
      await loginForm.locator('input[data-qa="login-password"]').fill(password);
      await loginForm.locator('button[data-qa="login-button"]').click();

      // ---- Verificar sesión: "Logged in as" ----
      await expect(page.getByText(/logged in as/i)).toBeVisible({ timeout: 20_000 });

      // Paso visible para continuar navegación
     // await page.getByRole('link', { name: /^products$/i }).click();
      //await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();

    } finally {
      // ---- Cleanup de usuario por API ----
      await api.delete('/api/deleteAccount', { form: { email, password } }).catch(() => {});
      await api.dispose();
    }
  });
});




