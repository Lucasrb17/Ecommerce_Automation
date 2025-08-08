import { Page, expect } from '@playwright/test';

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export class ContactUsPage {
  constructor(private readonly page: Page) {}

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/contact_us\/?$/);
    await expect(this.page.getByRole('heading', { name: /get\s+in\s+touch/i })).toBeVisible();
    await expect(this.page.locator('form#contact-us-form')).toBeVisible();
  }

  async fillForm(data: ContactFormData) {
    await this.page.locator('input[name="name"][data-qa="name"]').fill(data.name);
    await this.page.locator('input[name="email"][data-qa="email"]').fill(data.email);
    await this.page.locator('input[name="subject"][data-qa="subject"]').fill(data.subject);
    await this.page.locator('textarea[name="message"][data-qa="message"]').fill(data.message);
  }

  /**
   * Evitamos el diálogo nativo:
   * - Override de window.confirm = () => true
   * - Disparo del submit desde el DOM (requestSubmit/click/submit)
   * Luego esperamos la alerta de éxito dentro del contenedor del formulario.
   */
  async submitAndAcceptConfirm() {
    const form = this.page.locator('form#contact-us-form');
    const submit = this.page.locator('input[type="submit"][data-qa="submit-button"]');
    await expect(form).toBeVisible();
    await expect(submit).toBeVisible();

    await this.page.evaluate(() => {
      // Fuerza el OK del confirm
      (window as any).confirm = () => true;

      const formEl = document.querySelector('form#contact-us-form') as any;
      const submitEl = document.querySelector('input[type="submit"][data-qa="submit-button"]') as any;

      if (formEl && typeof formEl.requestSubmit === 'function') {
        formEl.requestSubmit(submitEl ?? undefined);
      } else if (submitEl && typeof submitEl.click === 'function') {
        submitEl.click();
      } else if (formEl && typeof formEl.submit === 'function') {
        formEl.submit();
      }
    });

    // Esperar SOLO la alerta de éxito del formulario (no la del footer)
    const formSuccess = this.page.locator('#contact-page .contact-form .alert-success.alert');
    await formSuccess.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertSuccessMessage(expected: string) {
    const formSuccess = this.page.locator('#contact-page .contact-form .alert-success.alert');
    await expect(formSuccess).toBeVisible({ timeout: 10_000 });
    await expect(formSuccess).toHaveText(expected);
  }

  async clickHomeAndVerify() {
    const homeBtn = this.page.locator('#form-section a.btn.btn-success[href="/"]');
    await expect(homeBtn).toBeVisible({ timeout: 10_000 });
    await homeBtn.click();

    await expect(this.page).toHaveURL(/\/$/);
    await expect(this.page.locator('header#header')).toBeVisible();
    await expect(this.page.locator('#slider')).toBeVisible();
  }
}
