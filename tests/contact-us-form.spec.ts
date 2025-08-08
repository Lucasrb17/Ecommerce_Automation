import { test, expect } from '@playwright/test';
import { ContactUsPage } from '../pages/contactuspage';

test.describe('Contact Us Form', () => {
  test('TC6 - Enviar formulario de contacto y volver al Home', async ({ page, baseURL }) => {
    const contact = new ContactUsPage(page);

    // 1-2) Launch + Navigate
    await page.goto(baseURL ?? 'http://automationexercise.com', { waitUntil: 'domcontentloaded' });

    // 3) Home visible (navbar + slider presentes)
    await expect(page.locator('header#header')).toBeVisible();
    await expect(page.locator('#slider')).toBeVisible();

    // 4) Click en "Contact us" (header)
    await page.locator('a[href="/contact_us"]').click();

    // 5) Verificar "GET IN TOUCH" visible
    await contact.verifyLoaded();

    // 6) Completar nombre, email, subject y mensaje (sin upload)
    await contact.fillForm({
      name: 'Lucas QA',
      email: 'lucas.qa@example.com',
      subject: 'Consulta de prueba',
      message: 'Este es un mensaje de prueba desde Playwright.',
    });

    // 8-9) Submit + aceptar confirm
    await contact.submitAndAcceptConfirm();

    // 10) Verificar mensaje de éxito exacto
    await contact.assertSuccessMessage('Success! Your details have been submitted successfully.');

    // 11) Click "Home" y verificar que estamos en Home
    await contact.clickHomeAndVerify();
  });
});
