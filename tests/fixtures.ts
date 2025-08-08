import { test as base, expect as baseExpect, Page } from '@playwright/test';
import { validUser } from '../utils/test-data';

type TestUser = {
  email: string;
  password: string;
  name?: string;
};

async function closeBlockingModalsIfAny(page: Page) {
  const modal = page.locator('#cartModal, .modal:has-text("Added")');
  if (await modal.isVisible().catch(() => false)) {
    await modal.locator('.close, button.close').first().click().catch(() => {});
    await modal.waitFor({ state: 'hidden' }).catch(() => {});
  }
}

// Helpers internos
async function _loginUI(page: Page, user: TestUser = validUser) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await closeBlockingModalsIfAny(page);

  // Campos específicos del bloque de Login
  await baseExpect(page.locator('form').filter({ hasText: /login/i })).toBeVisible();

  await page.locator('input[data-qa="login-email"]').fill(user.email);
  await page.locator('input[data-qa="login-password"]').fill(user.password);
  await page.locator('button[data-qa="login-button"]').click();

  const expectedName = user.name ?? validUser.name ?? '';
  const re = expectedName ? new RegExp(`logged\\s+in\\s+as\\s+${expectedName}`, 'i') : /logged\s+in\s+as/i;

  await baseExpect(page.getByText(re)).toBeVisible({ timeout: 15000 });
}

async function _logoutIfLoggedIn(page: Page) {
  const logged = page.getByText(/logged\s+in\s+as/i);
  if (await logged.isVisible().catch(() => false)) {
    await page.getByRole('link', { name: /logout/i }).click();
    await baseExpect(page.getByRole('link', { name: /signup \/ login/i })).toBeVisible();
  }
}

// Fixtures
type Fixtures = {
  loginUI: (user?: TestUser) => Promise<void>;
  logoutIfLoggedIn: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  loginUI: async ({ page }, use) => {
    const f = async (user?: TestUser) => _loginUI(page, user ?? validUser);
    await use(f);
  },
  logoutIfLoggedIn: async ({ page }, use) => {
    const f = async () => _logoutIfLoggedIn(page);
    await use(f);
  },
});

export const expect = baseExpect;

