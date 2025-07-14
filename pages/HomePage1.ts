import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByRole('link', { name: ' Signup / Login' });
  }

  async navigate() {
    await this.page.goto('/');
  }

  async goToLogin() {
    await expect(this.loginLink).toBeVisible();
    await this.loginLink.click();
  }
}
