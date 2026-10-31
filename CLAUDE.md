# Gastos do Dia — controle de gastos diários

PWA mobile-first, 100% local (sem backend): React 19 + TypeScript strict + Vite 8, IndexedDB via Dexie 4, Tailwind 4. Requisitos em `tasks/prd-controle-gastos-diarios/prd.md`; arquitetura em `tasks/prd-controle-gastos-diarios/techspec.md`.

## Comandos

| Comando                          | O que faz                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev`                    | Servidor de desenvolvimento na porta 5173                                                                   |
| `npm run build`                  | Typecheck + build de produção (com service worker)                                                          |
| `npm run preview`                | Serve o build na porta 5173                                                                                 |
| `npm run lint`                   | ESLint                                                                                                      |
| `npm run typecheck`              | `tsc --noEmit`                                                                                              |
| `npm test`                       | Testes de unidade e integração (Vitest, jsdom, fake-indexeddb)                                              |
| `npm run test:coverage`          | Testes com cobertura (falha abaixo de 80% de linhas e branches em `src/domain/` e `src/data/`)              |
| `npm run test:e2e`               | Playwright contra o build servido por `vite preview` na porta 5180 (`E2E_PORT` muda), com a CSP de produção |
| `npx @lhci/cli@0.15.1 autorun`   | Lighthouse CI sobre `dist/` (rode `npm run build` antes; limites em `lighthouserc.json`)                    |
| `node scripts/make-fixtures.mjs` | Regenera as planilhas de `tests/fixtures/`                                                                  |
| `node scripts/make-icons.mjs`    | Regenera os ícones PNG do PWA a partir de `public/favicon.svg`                                              |

Node.js 22 LTS. Nesta máquina o Node portátil está em `%LOCALAPPDATA%\Programs\node22` (fora do PATH: prefixe `$env:Path="$env:LOCALAPPDATA\Programs\node22;$env:Path"` no PowerShell).

O disco C: desta máquina está quase cheio. Antes de rodar testes ou o Playwright, aponte os navegadores e a pasta temporária para o projeto (ignorado pelo git):

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.cache\ms-playwright"
$env:TEMP = $env:TMP = "$PWD\.cache\tmp"
```

## Portas

- Frontend: faixa 51xx (dev 5173, E2E 5180). Verifique se a porta está livre antes de subir um servidor.
- Não há backend nem banco externo.

## Arquitetura (dependências em uma só direção)

- `src/domain/` — funções puras (dinheiro, datas, categorias, resumo, orçamento, comparação, importação, bolhas). Sem React nem IndexedDB.
- `src/data/` — Dexie (`db.ts`), repositórios, `storageGuard`, `xlsxAdapter`, `sampleData`.
- `src/hooks/` — hooks de aplicação (`useLiveQuery` + domínio).
- `src/features/` — telas por funcionalidade; `src/ui/` — componentes base.
- `src/lib/` — `errors.ts` (`AppError`) e `log.ts` (logger).

## Convenções

- Dinheiro sempre em **centavos inteiros**; formatação só na borda (`formatMoney`).
- Datas como string `YYYY-MM-DD` no horário local; meses como `YYYY-MM`. Nunca `new Date('YYYY-MM-DD')` (vira UTC).
- Campos opcionais ausentes persistidos como `null`, nunca `undefined`.
- Textos de UI em pt-BR; moeda `R$ 1.234,56`; datas `dd/mm/aaaa`.
- O logger nunca registra valores, descrições ou nomes de carteira.
- Nenhum dado sai do aparelho: sem `fetch` de dados, CSP `connect-src 'self'`.
- CSP estrita (sem `'unsafe-inline'`): cabeçalhos em `security-headers.mjs`, espelhados em `netlify.toml` (verificado em `src/deploy.test.ts`). Evite `<select>` nativo (alguns WebKit injetam estilo bloqueado) e atributos `style` em HTML estático.
- Telas fora do Resumo/Lançamentos e as bibliotecas de planilha e de animação são carregadas sob demanda; mantenha o pacote inicial enxuto.
- Nas ferramentas de edição, escapes `\uXXXX` em strings viram o caractere literal: use `String.fromCharCode` ou classes Unicode (`\p{M}`).
- Cores só via tokens em `src/styles/tokens.css` (claro/escuro); contraste verificado em `src/styles/contrast.test.ts`. Cor nunca é o único identificador.
- Animações respeitam "reduzir movimento".
- Testes de unidade ao lado do código (`*.test.ts`); E2E em `tests/e2e/`; fixtures em `tests/fixtures/`.
