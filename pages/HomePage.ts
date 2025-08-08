import { expect, Page } from '@playwright/test';
import { validUser } from '../utils/test-data';

export class HomePage {
  constructor(private readonly page: Page) {}

  async navigate() {
    await this.page.goto('https://automationexercise.com/');
    await expect(this.page).toHaveURL(/automationexercise\.com/);
  }

  async goToLogin() {
    await this.page.getByRole('link', { name: /signup \/ login/i }).click();
    await expect(this.page.getByRole('heading', { name: /login to your account/i })).toBeVisible();
  }

  async goToProducts() {
    await this.page.getByRole('link', { name: /products/i }).click();
    await expect(this.page).toHaveURL(/\/products/);
  }

  async login(email: string = validUser.email, password: string = validUser.password) {
    await this.goToLogin();
    await this.page.locator('input[data-qa="login-email"]').fill(email);
    await this.page.locator('input[data-qa="login-password"]').fill(password);
    await this.page.locator('button[data-qa="login-button"]').click();
    await this.verifyLoggedIn(validUser.name);
  }

  async verifyLoggedIn(expectedUserName: string = validUser.name) {
    const re = expectedUserName
      ? new RegExp(`logged\\s+in\\s+as\\s+${expectedUserName}`, 'i')
      : /logged\s+in\s+as/i;

    await expect
      .poll(async () => {
        const el = this.page.getByText(re);
        return (await el.isVisible().catch(() => false)) ? true : null;
      }, {
        message: `No se encontró el texto "Logged in as ${expectedUserName}"`,
        timeout: 15000,
      })
      .toBeTruthy();
  }

  async verifyLoggedOut() {
    await expect(this.page.getByRole('link', { name: /signup \/ login/i })).toBeVisible();
  }

  async logout() {
    const logged = this.page.getByText(/logged in as/i);
    if (await logged.isVisible().catch(() => false)) {
      await this.page.getByRole('link', { name: /logout/i }).click();
      await this.verifyLoggedOut();
    }
  }
}
