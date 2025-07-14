import { request } from '@playwright/test';

const BASE_URL = 'https://automationexercise.com/api';

export async function verifyLoginAPI(email: string, password: string) {
  const context = await request.newContext();
  const response = await context.post(`${BASE_URL}/verifyLogin`, {
    form: { email, password },
  });
  const body = await response.text(); // la respuesta no es JSON, sino texto plano
  return { status: response.status(), body };
}

export async function verifyLoginWithoutEmail(password: string) {
  const context = await request.newContext();
  const response = await context.post(`${BASE_URL}/verifyLogin`, {
    form: { password },
  });
  const body = await response.text();
  return { status: response.status(), body };
}
