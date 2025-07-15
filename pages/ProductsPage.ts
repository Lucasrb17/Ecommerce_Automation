import { Page, expect } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyLoaded() {
    await expect(this.page.locator('body')).toContainText('All Products');
  }

  async viewFirstProduct() {
    await this.page.locator('.nav.nav-pills.nav-justified > li > a').first().click();
  }

  async verifyProductDetail() {
    await expect(this.page.getByRole('heading', { name: 'Blue Top' })).toBeVisible();
    await expect(this.page.locator('section')).toContainText('Rs. 500');
  }

  async setQuantity(quantity: number) {
    const qtyInput = this.page.locator('#quantity');
    await qtyInput.fill(quantity.toString());
  }

  async addToCart() {
    await this.page.getByRole('button', { name: ' Add to cart' }).click();
    await expect(this.page.locator('#cartModal')).toContainText('Added!');
    await expect(this.page.locator('u')).toContainText('View Cart');
  }

  async continueShopping() {
    await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
  }

  async viewProductByIndex(index: number) {
  await this.page.locator('.nav.nav-pills.nav-justified > li > a').nth(index).click();
}

async viewProductBySelector(selector: string) {
  await this.page.locator(selector).click();
}

async verifyProductDetail(name: string, price: string) {
  await expect(this.page.locator('section')).toContainText(name);
  await expect(this.page.locator('section')).toContainText(price);
}

async setQuantity(quantity: number) {
  await this.page.locator('#quantity').fill(quantity.toString());
}

async addToCartAndContinue() {
  await this.page.getByRole('button', { name: ' Add to cart' }).click();
  await expect(this.page.locator('#cartModal')).toContainText('Added!');
  await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
}
}
