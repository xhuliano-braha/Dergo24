async page => {
  const origin = 'http://localhost:3000';
  const checks = [];
  const check = (name, passed, details = '') => checks.push({ name, passed, details });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  check('Home page', (await page.title()).includes('Dergo24'), await page.title());

  const trackingInput = page.getByPlaceholder('P.sh. D24-26-AB12CD34');
  await trackingInput.fill('BAD-CODE');
  await page.getByRole('button', { name: 'Gjurmo dërgesën' }).click();
  const unknownShipment = page.getByText('Nuk u gjet asnjë dërgesë me këtë kod.');
  await unknownShipment.waitFor({ state: 'visible' });
  check(
    'Unknown tracking code',
    await unknownShipment.isVisible(),
  );

  await page.getByRole('button', { name: 'Dërgo tani' }).click();
  const booking = page.getByRole('dialog');
  check('Booking modal', await booking.getByRole('heading', { name: 'Dërgo një pako' }).isVisible());
  await booking.getByRole('button', { name: 'Verifiko adresën' }).click();
  check(
    'Empty-address feedback',
    await booking.getByText('Shkruani adresën para se ta verifikoni.').isVisible(),
  );
  await booking.getByRole('spinbutton', { name: 'Pesha (kg)' }).fill('3.2');
  await booking.getByRole('button', { name: /Express/ }).click();
  check('Price calculator', await booking.getByText('1100 Lekë', { exact: true }).isVisible());
  await booking.getByRole('button', { name: 'Në një pikë Dergo24' }).click();
  const pickup = booking.getByRole('combobox', { name: 'Pika e tërheqjes' });
  await pickup.locator('option').nth(1).waitFor({ state: 'attached' });
  check('Pickup points', (await pickup.locator('option').count()) > 1);
  await booking.getByRole('button', { name: 'Mbyll' }).click();

  await page.getByRole('button', { name: 'Kërko ofertë transporti' }).click();
  const quote = page.getByRole('dialog');
  await quote.getByRole('button', { name: /Dërgo kërkesën/ }).click();
  check('Quote validation', (await quote.locator(':invalid').count()) > 0);
  await quote.getByRole('button', { name: 'Mbyll' }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Hap menunë' }).click();
  check('Mobile menu', await page.getByRole('link', { name: 'Shërbimet' }).last().isVisible());
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  check('No horizontal overflow', widths.scroll === widths.client, JSON.stringify(widths));

  for (const path of ['/terms', '/privacy', '/claims-policy', '/account', '/staff', '/courier']) {
    const response = await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
    check(`Route ${path}`, Boolean(response?.ok()), String(response?.status()));
  }

  await page.screenshot({ path: 'output/playwright/local-brave-smoke.png', fullPage: true });
  const summary = {
    passed: checks.filter(item => item.passed).length,
    failed: checks.filter(item => !item.passed).length,
  };
  if (summary.failed > 0) {
    throw new Error(`Smoke test failed: ${JSON.stringify({ checks, summary })}`);
  }
  return {
    checks,
    summary,
  };
}
