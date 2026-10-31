// Gera os PNGs do PWA a partir de public/favicon.svg: node scripts/make-icons.mjs
// Usa o Chromium do Playwright já instalado para os testes.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(file, size, { maskable = false } = {}) {
  // Ícone "maskable": fundo cheio e o desenho dentro da zona segura (80%).
  const inner = maskable ? Math.round(size * 0.8) : size;
  const bg = maskable ? '#4338ca' : 'transparent';
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
    </body></html>`,
  );
  await page.screenshot({
    path: new URL(`../public/${file}`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1'),
    omitBackground: !maskable,
  });
  console.log('ok', file);
}

await render('pwa-192x192.png', 192);
await render('pwa-512x512.png', 512);
await render('maskable-512x512.png', 512, { maskable: true });
await render('apple-touch-icon.png', 180, { maskable: true });
await browser.close();
