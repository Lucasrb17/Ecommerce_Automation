// tests/ui-api.hybrid.spec.ts
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

test.describe('Híbrido: crear usuario por API, login por UI y cleanup por API', () => {
  let api: APIRequestContext;
  const base = 'https://automationexercise.com';

  // helpers
  const now = () => new Date().toISOString().replace(/[:.TZ-]/g, '').slice(0, 14);
  const email = `hybrid_${now()}@example.com`;
  const password = 'Strong!Pass42';
  const fullName = 'Playwright Hybrid QA';

  const toForm = (obj: Record<string, string | number>) =>
    new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, String(v)])).toString();

  async function jsonBody(res: any) {
    try {
      return await res.json();
    } catch {
      return { message: await res.text() };
    }
  }

  function expectResponse(body: any, expectedCode: number, messageIncludes?: string | RegExp) {
    expect(body).toHaveProperty('responseCode');
    expect(Number(body.responseCode)).toBe(expectedCode);
    const msg = String(body.message ?? body.Message ?? '').toLowerCase();
    if (messageIncludes) {
      if (typeof messageIncludes === 'string') {
        expect(msg).toContain(messageIncludes.toLowerCase());
      } else {
        expect(msg).toMatch(messageIncludes);
      }
    }
  }

  test.beforeAll(async () => {
    api = await pwRequest.newContext({
      baseURL: base,
      extraHTTPHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
      },
      timeout: 20_000,
    });

    // Crear usuario por API (la API siempre responde HTTP 200 y pone el "código" en el body)
    const createRes = await api.post('/api/createAccount', {
      data: toForm({
        name: fullName,
        email,
        password,
        title: 'Mr',
        birth_date: 1,
        birth_month: 1,
        birth_year: 1990,
        firstname: 'Playwright',
        lastname: 'Hybrid',
        company: 'ACME',
        address1: 'Fake St 123',
        address2: 'Floor 2',
        country: 'Canada',
        zipcode: 'A1B2C3',
        state: 'ON',
        city: 'Toronto',
        mobile_number: '1234567890',
      }),
    });
    const createBody = await jsonBody(createRes);
    expectResponse(createBody, 201, /user created/);
  });

  test.afterAll(async () => {
    // Borrar usuario por API (cleanup)
    const delRes = await api.delete('/api/deleteAccount', {
      data: toForm({ email, password }),
    });
    const delBody = await jsonBody(delRes);
    expectResponse(delBody, 200, /account deleted/);

    await api.dispose();
  });

  test('Login por UI con usuario creado por API y validación de header', async ({ page }) => {
    // 1) Home
    await page.goto(base, { waitUntil: 'domcontentloaded' });

    // 2) Ir a "Signup / Login"
    await page.getByRole('link', { name: /signup\s*\/\s*login/i }).click();

    // 3) Ver login form y completar (estos data-qa son del sitio)
    await expect(page.getByRole('heading', { name: /login to your account/i })).toBeVisible();

    await page.locator('[data-qa="login-email"]').fill(email);
    await page.locator('[data-qa="login-password"]').fill(password);
    await page.locator('[data-qa="login-button"]').click();

    // 4) Afirmar “Logged in as <name>”
    // Suele mostrarse en el header una vez autenticado
    const loggedAs = page.getByText(new RegExp(`^\\s*Logged in as\\s+${fullName}\\s*$`, 'i'));
    await expect(loggedAs).toBeVisible();

    // (Opcional) pequeña aserción extra: el botón "Delete Account" aparece en el menú
    await expect(page.getByRole('link', { name: /delete account/i })).toBeVisible();
  });
});
