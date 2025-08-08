import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;
  readonly productsHref: Locator;

  constructor(page: Page) {
    this.page = page;
    // Evitamos glyphs en el name (inestables por icon fonts)
    this.loginLink = page.getByRole('link', { name: /signup\s*\/\s*login/i });
    this.logoutLink = page.getByRole('link', { name: /logout/i });
    this.productsHref = page.locator('a[href="/products"]').first();
  }

  async navigate() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async ensureGuest() {
    const loggedBadge = this.page.getByText(/logged in as/i).first();
    if (await loggedBadge.isVisible().catch(() => false)) {
      await this.logoutLink.click();
      await expect(this.page).toHaveURL(/\/(login|)$/);
    }
    // Cerrar cookies/newsletter si aparece intermitente
    const cookieBtn = this.page.locator('button:has-text("Accept")').first();
    if (await cookieBtn.isVisible().catch(() => false)) await cookieBtn.click();
  }

  async goToProducts() {
    await this.productsHref.click();
    await expect(this.page).toHaveURL(/\/products/);
  }

  async verifyLoggedIn(username: string) {
    await expect(this.page.getByText(new RegExp(`Logged in as\\s*${username}`, 'i'))).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
  }
}

