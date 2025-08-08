// tests/api.automationexercise.fixed.spec.ts
import { test, expect, APIRequestContext, request as pwRequest } from '@playwright/test';

test.describe('Reto avanzado - Validación de APIs (AutomationExercise)', () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await pwRequest.newContext({
      baseURL: 'https://automationexercise.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
      },
      timeout: 20_000,
    });
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  // Utils
  const now = () => new Date().toISOString().replace(/[:.TZ-]/g, '').slice(0, 14);
  const toForm = (obj: Record<string, string | number>) =>
    new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, String(v)])).toString();

  async function jsonBody(res: any) {
    try {
      return await res.json();
    } catch {
      const t = await res.text();
      // uniformamos por si viniera texto
      return { message: t };
    }
  }

  function expectResponse(
    body: any,
    expectedCode: number,
    messageIncludes?: string | RegExp,
  ) {
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

  test('API 1: GET productsList -> responseCode 200 + contrato mínimo + SLO', async () => {
    const start = Date.now();
    const res = await api.get('/api/productsList');
    const dur = Date.now() - start;

    const body = await jsonBody(res);
    expectResponse(body, 200);

    expect(body).toHaveProperty('products');
    expect(Array.isArray(body.products)).toBeTruthy();
    if (body.products.length) {
      expect(body.products[0]).toHaveProperty('name');
      expect(body.products[0]).toHaveProperty('price');
      expect(body.products[0]).toHaveProperty('category');
    }

    expect(dur, `tiempo de respuesta ${dur}ms`).toBeLessThan(3000);
  });

  test('API 2: POST productsList -> responseCode 405 + mensaje', async () => {
    const res = await api.post('/api/productsList');
    const body = await jsonBody(res);

    // El sitio indica 405 en body
    expectResponse(body, 405, /not supported/);
  });

  test('API 3: GET brandsList -> responseCode 200', async () => {
    const res = await api.get('/api/brandsList');
    const body = await jsonBody(res);
    expectResponse(body, 200);
    expect(body).toHaveProperty('brands');
    expect(Array.isArray(body.brands)).toBeTruthy();
  });

  test('API 4: PUT brandsList -> responseCode 405 + mensaje', async () => {
    const res = await api.put('/api/brandsList');
    const body = await jsonBody(res);
    expectResponse(body, 405, /not supported/);
  });

  test('API 5: POST searchProduct (happy path) -> responseCode 200 + resultados coherentes', async () => {
    const term = 'top';
    const res = await api.post('/api/searchProduct', {
      data: toForm({ search_product: term }),
    });
    const body = await jsonBody(res);

    expectResponse(body, 200);
    expect(body).toHaveProperty('products');
    expect(Array.isArray(body.products)).toBeTruthy();

    const hits = body.products.filter((p: any) => {
      const name = `${p.name ?? ''}`.toLowerCase();
      const cat = `${p.category?.category ?? ''}`.toLowerCase();
      return name.includes(term) || cat.includes(term);
    });
    expect(hits.length, 'debería haber al menos un resultado relevante').toBeGreaterThan(0);
  });

  test('API 6: POST searchProduct sin parámetro -> responseCode 400 + mensaje', async () => {
    const res = await api.post('/api/searchProduct', {
      data: toForm({}), // faltante
    });
    const body = await jsonBody(res);

    expectResponse(body, 400, /missing|search_product/);
  });

  test('API 10: verifyLogin inválido -> responseCode 404 + "User not found!"', async () => {
    const res = await api.post('/api/verifyLogin', {
      data: toForm({
        email: `nouser_${now()}@example.com`,
        password: 'invalid-pass',
      }),
    });
    const body = await jsonBody(res);

    expectResponse(body, 404, /user not found/);
  });

  test('APIs 11 + 14 + 12: ciclo de vida usuario (create → getByEmail → delete)', async () => {
    const email = `qa+${now()}@example.com`;

    // CREATE (responseCode 201)
    const createRes = await api.post('/api/createAccount', {
      data: toForm({
        name: 'Playwright QA',
        email,
        password: 'Strong!Pass42',
        title: 'Mr',
        birth_date: 1,
        birth_month: 1,
        birth_year: 1990,
        firstname: 'Playwright',
        lastname: 'QA',
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

    // GET BY EMAIL (responseCode 200)
    const getRes = await api.get('/api/getUserDetailByEmail', {
      params: { email },
    });
    const getBody = await jsonBody(getRes);
    expectResponse(getBody, 200);
    expect(getBody).toHaveProperty('user');
    expect(getBody.user).toHaveProperty('email');
    expect(String(getBody.user.email).toLowerCase()).toBe(email.toLowerCase());

    // DELETE (responseCode 200)
    const delRes = await api.delete('/api/deleteAccount', {
      data: toForm({ email, password: 'Strong!Pass42' }),
    });
    const delBody = await jsonBody(delRes);
    expectResponse(delBody, 200, /account deleted/);
  });
});
