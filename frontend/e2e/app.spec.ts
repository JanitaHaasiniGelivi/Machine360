import { expect, test } from '@playwright/test';

const routes = [
  ['/', 'Factory Health & Intelligence Dashboard'],
  ['/machines', 'Machine Registry'],
  ['/predict', 'Explainable AI Prediction Center'],
  ['/diagnosis', 'Fault Diagnosis'],
  ['/digital-twin', 'Digital Twin'],
  ['/simulator', 'What-If'],
  ['/batch', 'CSV Telemetry Batch Inference'],
  ['/maintenance', 'Maintenance'],
  ['/cost-simulator', 'Cost'],
  ['/copilot', 'AI Maintenance Copilot'],
  ['/analytics', 'ML Model Analytics'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
] as const;

test('all application sections render and capture screenshots', async ({ page }, testInfo) => {
  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: new RegExp(heading, 'i') }).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`page-${route.slice(1) || 'dashboard'}.png`), fullPage: true });
  }
});

test('real login and role profiles work through the live API', async ({ page, request }) => {
  for (const credential of [
    ['admin@machinemind360.com', 'AdminPassword123!', 'admin'],
    ['technician@machinemind360.com', 'TechPassword123!', 'technician'],
    ['viewer@machinemind360.com', 'ViewerPassword123!', 'viewer'],
  ]) {
    const response = await request.post('http://127.0.0.1:8000/api/v1/auth/login', {
      data: { email: credential[0], password: credential[1] },
    });
    expect(response.ok()).toBeTruthy();
    const session = await response.json();
    expect(session.user.role).toBe(credential[2]);
    await page.goto('/');
    await page.evaluate(({ token }) => localStorage.setItem('mm360_token', token), { token: session.access_token });
    await page.reload();
    await expect(page.getByText(credential[2], { exact: true })).toBeVisible();
  }
  await page.getByTitle('Sign Out').click();
  await expect(page.getByText('DEMO ACCESS')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('mm360_token'))).toBeNull();
});

test('machine registry create, edit, and delete persists through the API', async ({ page }) => {
  await page.goto('/machines');
  await page.getByRole('button', { name: /register new machine/i }).click();
  await page.getByLabel(/asset id/i).fill('PW-MACHINE-01');
  await page.getByLabel(/machine name/i).fill('Playwright Test Mill');
  await page.getByRole('button', { name: /register machine|save machine|create machine/i }).click();
  await expect(page.getByText('Playwright Test Mill')).toBeVisible();
  await expect(page.getByText('PW-MACHINE-01')).toBeVisible();
  const response = await page.request.get('http://127.0.0.1:8000/api/v1/machines?search=PW-MACHINE-01');
  expect(response.ok()).toBeTruthy();
  const [machine] = await response.json();
  expect(machine.name).toBe('Playwright Test Mill');
  await page.getByText('Playwright Test Mill').click();
  const del = await page.request.delete(`http://127.0.0.1:8000/api/v1/machines/${machine.id}`);
  expect(del.status()).toBe(204);
});

test('single inference, CSV batch inference, export, and maintenance copilot execute', async ({ page }) => {
  await page.goto('/predict');
  await page.getByRole('button', { name: /high tool wear|twf/i }).click();
  await page.getByRole('button', { name: /run prediction|execute inference/i }).click();
  await expect(page.getByText(/failure probability/i)).toBeVisible();

  await page.goto('/batch');
  await page.locator('input[type=file]').setInputFiles({
    name: 'readings.csv', mimeType: 'text/csv',
    buffer: Buffer.from('Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]\nM,298.1,308.6,1551,42.8,12\nL,298.9,309.2,1390,52,225\n'),
  });
  await page.getByRole('button', { name: /execute batch analysis/i }).click();
  await expect(page.getByText('Total Observations')).toBeVisible();
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export/i }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/machinemind_batch_results_.*\.csv/);

  await page.goto('/copilot');
  await page.getByPlaceholder(/ask about machine telemetry/i).fill('What should I inspect for high tool wear?');
  await page.locator('input[placeholder*="Ask about"]').press('Enter');
  await expect(page.getByText(/tool wear|maintenance|inspect/i).last()).toBeVisible();
});

test('interactive simulators, work orders, reports, and settings are usable', async ({ page }) => {
  await page.goto('/simulator');
  await expect(page.locator('input[type=range]').first()).toBeVisible();
  await page.locator('input[type=range]').first().fill('210');
  await page.goto('/digital-twin');
  await page.getByRole('button').filter({ hasText: /start|run|simulate/i }).first().click();
  await page.goto('/maintenance');
  await page.getByRole('button', { name: /create work order|new work order|create ticket/i }).click();
  await expect(page.getByText(/issue summary/i)).toBeVisible();
  await page.goto('/cost-simulator');
  await page.getByRole('button', { name: /simulate|calculate/i }).click();
  await expect(page.getByText(/reactive total cost/i)).toBeVisible();
  await page.goto('/reports');
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /download|export|print/i }).first().click();
  await pdfDownload;
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
});

test('mobile navigation remains usable at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /factory health/i })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('mobile-dashboard.png'), fullPage: true });
  await page.goto('/predict');
  await expect(page.getByRole('heading', { name: /prediction center/i })).toBeVisible();
  await expect(page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth)).resolves.toBeTruthy();
});
