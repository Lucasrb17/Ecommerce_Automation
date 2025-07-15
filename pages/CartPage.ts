import { Page, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openCart() {
    await this.page.getByRole('link', { name: ' Cart' }).click();
  }

  async verifyProductInCart(productName: string) {
    await expect(this.page.getByRole('link', { name: productName })).toBeVisible();
  }

  async proceedToCheckout() {
    await this.page.getByText('Proceed To Checkout').click();
  }

  async verifyGuestCheckoutPrompt() {
    await expect(this.page.locator('#checkoutModal')).toContainText('Checkout');
    await expect(this.page.locator('#checkoutModal')).toContainText('Register / Login');
  }

  async goToCart() {
  await this.page.getByRole('link', { name: ' Cart' }).click();
}

async verifyTotalPrice(expectedTotal: string) {
  await expect(this.page.getByText(expectedTotal)).toBeVisible();
}

async proceedToCheckout() {
  await this.page.getByText('Proceed To Checkout').click();
}

}
