import { test, expect } from '@playwright/test';

test.describe('Contact Us Form', () => {
  test('TC6 - Enviar formulario de contacto y volver al Home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: /contact us/i }).click();
    await expect(page).toHaveURL(/\/contact_us$/);

    // Localizador más específico para evitar strict mode violation
    await expect(page.getByRole('heading', { name: /get\s+in\s+touch/i })).toBeVisible();

    await expect(page.locator('form#contact-us-form')).toBeVisible();

    await page.locator('input[name="name"]').fill('QA Tester');
    await page.locator('input[name="email"]').fill('qatester@example.com');
    await page.locator('input[name="subject"]').fill('Feedback');
    await page.locator('textarea[name="message"]').fill('This is a test message from QA automation.');

    // Adjuntar archivo (usa una imagen o txt en tu carpeta de tests)
    //await page.setInputFiles('input[name="upload_file"]', 'tests/fixtures/sample.txt');

    await page.getByRole('button', { name: /submit/i }).click();

    // Confirmación
    //await expect(page.getByText(/success! your details have been submitted/i)).toBeVisible();

    // Volver al home
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL('/');
  });
});
