import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly productsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByRole('link', { name: ' Signup / Login' });
    this.productsLink = page.getByRole('link', { name: ' Products' });
  }

  async navigate() {
    await this.page.goto('/');
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async goToProducts() {
    await this.productsLink.click();
  }

  async verifyLoggedIn(username: string) {
    await expect(this.page.getByText(`Logged in as ${username}`)).toBeVisible();
    await expect(this.page.getByRole('link', { name: ' Logout' })).toBeVisible();
  }
}


