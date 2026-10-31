import { expect, test } from '@playwright/test';

// O Lighthouse 12 removeu a categoria "PWA"; os requisitos de instalação são verificados aqui.
test('PWA instalável: manifest completo, ícones e service worker', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({
    name: 'Gastos do Dia',
    short_name: 'Gastos',
    lang: 'pt-BR',
    start_url: '/',
    display: 'standalone',
  });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons as { src: string }[]) {
    const res = await request.get(`/${icon.src}`);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }

  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.scriptURL ?? null;
  });
  expect(sw).toMatch(/\/sw\.js$/);
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', /#/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  );
});
