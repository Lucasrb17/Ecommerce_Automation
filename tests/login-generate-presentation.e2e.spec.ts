import { test, expect } from '@playwright/test';


test.slow(); // 3x timeout for this slow and complex flow

test('Full end-to-end flow: Login and generate presentation', async ({ page }) => {
  // 0. Bypass Cloudflare challenge with test flag
  await page.addInitScript(() => {
    window.localStorage.setItem('isTestEnvironment', 'true');
  });
 // LOG DE TODAS LAS REQUESTS SALIENTES (para debugging)
  page.on('request', request => {
    console.log('➡️ Request:', request.method(), request.url());
  });
  // 1. Go to login page and complete email
  await page.goto('https://qc.pitchdeck.io/docs/login?');
  await expect(page.getByRole('heading', { name: 'Create your free account or' })).toBeVisible();
  await expect(page.locator('#VariantALoginPage')).toContainText('Sign up with your work email and get additional 100 credits');
  await page.getByRole('button', { name: 'Continue with Email' }).click();
  await expect(page.getByRole('heading', { name: 'Continue with Email' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Email address' })).toBeVisible();

  // 2. Enter email with human-like typing
  const emailBox = page.getByRole('textbox', { name: 'Enter your email' });
  await emailBox.pressSequentially('user@bugzero.com');

  

  // 3. Click "Continue with Email" (no espera request todavía)
await page.locator('#EmailLogin div').filter({ hasText: 'Continue with EmailWe’ll' }).nth(2).click();

// 4. Ahora sí, espera el click que dispara el request y el response
await Promise.all([
  page.waitForResponse(resp =>
    resp.url().endsWith('/docs/checkEmail') && resp.request().method() === 'POST' && resp.status() === 200
  ),
  page.getByRole('button', { name: 'Continue' }).click()
]);

  await expect(page.getByText('user@bugzero.com')).toBeVisible();
  await expect(page.locator('#EmailLogin')).toContainText('Password');

  // 5. Enter password with human-like typing
  const passwordBox = page.getByRole('textbox', { name: 'Enter password' });
  await passwordBox.pressSequentially('User@Bug0');

  // 6. Click continue and wait for login API
  await Promise.all([
    page.waitForResponse(resp =>
      resp.url().endsWith('/docs/login') && resp.request().method() === 'POST' && resp.status() === 200
    ),
    page.getByRole('button', { name: 'Continue' }).click()
  ]);

  // 7. Wait for profile API (optional, but often triggered after login)
  await page.waitForResponse(resp =>
    resp.url().endsWith('/docs/getProfile') && resp.request().method() === 'GET' && resp.status() === 200
  );

  // 8. Navigate to dashboard and validate UI
  await expect(page.getByTestId('dashboard').locator('span')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('dashboard').locator('span')).toContainText('Dashboard');
  await expect(page.getByText('Start Your Presentation')).toBeVisible();

  // 9. Create a new presentation
  await page.getByText('Describe your topic or idea,').click();
  await expect(page.locator('#doccreateholder')).toContainText('Transform Your Ideas Into Slides With AI');
  await expect(page.getByText('Popular templates for your')).toBeVisible();

  // 10. Shuffle template and start generation
  await page.locator('#shuffle-text-0').click();
  await expect(page.getByTestId('generatepresentationnow').locator('span')).toContainText('Generate Presentation Now');

  // 11. Click generate and wait for createPresentation API
  await Promise.all([
    page.waitForResponse(resp =>
      resp.url().endsWith('/docs/createPresentation') && resp.request().method() === 'POST' && resp.status() === 200
    ),
    page.getByTestId('generatepresentationnow').click()
  ]);

  // 12. Wait for the presentation to be generated (this step can take several minutes!)
  await expect(page.getByRole('heading', { name: 'Your presentation is ready!' })).toBeVisible({ timeout: 100000 }); // Wait up to ~2 minutes

  // 13. Final validation
  await expect(page.locator('#rootmodel')).toContainText('Your presentation is ready! View or edit it now.');
});








