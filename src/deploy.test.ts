import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from '../security-headers.mjs';

const toml = readFileSync(resolve(__dirname, '../netlify.toml'), 'utf8');

describe('configuração de deploy', () => {
  it('netlify.toml usa os mesmos cabeçalhos de segurança dos E2E', () => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(toml).toContain(`${name} = "${value}"`);
    }
  });

  it('CSP bloqueia envio de dados a terceiros', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("connect-src 'self'");
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("default-src 'self'");
  });

  it('rewrite da SPA e sem cache para index.html e sw.js', () => {
    expect(toml).toMatch(/from = "\/\*"\s+to = "\/index.html"\s+status = 200/);
    expect(toml).toMatch(/for = "\/index.html"\s+\[headers.values\]\s+Cache-Control = "no-cache"/);
    expect(toml).toMatch(/for = "\/sw.js"\s+\[headers.values\]\s+Cache-Control = "no-cache"/);
  });
});
