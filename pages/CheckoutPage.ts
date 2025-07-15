import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyAddressSections() {
    await expect(this.page.locator('#cart_items')).toContainText('Address Details');
    await expect(this.page.getByRole('heading', { name: 'Your delivery address' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Your billing address' })).toBeVisible();
  }

  async placeOrder() {
    await this.page.getByRole('link', { name: 'Place Order' }).click();
  }

  async fillPaymentForm() {
    await expect(this.page.getByRole('heading', { name: 'Payment' })).toBeVisible();
    await this.page.locator('input[name="name_on_card"]').fill('Test TEST');
    await this.page.locator('input[name="card_number"]').fill('444444444444444444444');
    await this.page.getByRole('textbox', { name: 'ex.' }).fill('111');
    await this.page.getByRole('textbox', { name: 'MM' }).fill('11');
    await this.page.getByRole('textbox', { name: 'YYYY' }).fill('2030');
    await this.page.getByRole('button', { name: 'Pay and Confirm Order' }).click();
  }

  async verifyOrderConfirmation() {
    await expect(this.page.locator('#form')).toContainText('Order Placed!');
    await expect(this.page.locator('#form')).toContainText('Congratulations! Your order has been confirmed!');
    await this.page.getByRole('link', { name: 'Continue' }).click();
  }
}
