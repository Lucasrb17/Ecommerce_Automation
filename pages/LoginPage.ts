import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(email: string, password: string) {
    await expect(this.page.locator('#form')).toContainText('Login to your account');

    await this.page
      .locator('form')
      .filter({ hasText: 'Login' })
      .getByPlaceholder('Email Address')
      .fill(email);

    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async logout() {
    await this.page.getByRole('link', { name: ' Logout' }).click();
  }

  async verifyLoginFormVisible() {
    await expect(this.page.locator('#form')).toContainText('Login to your account');
  }
}

