import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillLoginForm(email: string, password: string) {
    await expect(this.page.locator('#form')).toContainText('Login to your account');
    await this.page
      .locator('form')
      .filter({ hasText: 'Login' })
      .getByPlaceholder('Email Address')
      .fill(email);

    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
  }

  async submitLogin() {
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async verifyLoginSuccess(username: string) {
    await expect(this.page.getByRole('link', { name: ' Logout' })).toBeVisible();
    await expect(this.page.getByText(`Logged in as ${username}`)).toBeVisible();
  }

async logout() {
  await this.page.getByRole('link', { name: ' Logout' }).click();
}


  async verifyLoginError() {
    await expect(this.page.locator('#form')).toContainText('Your email or password is incorrect!');
  }
}
