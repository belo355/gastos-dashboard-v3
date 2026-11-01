# Gastos do Dia — controle de gastos diários

PWA mobile-first e 100% local (sem backend nem conta) para registrar despesas do dia a dia e mostrar para onde vai o dinheiro, por categoria. É um projeto de estudo e portfólio: o acabamento conta tanto quanto a funcionalidade. O nome "Gastos do Dia" é provisório.

Documentos de referência:

| Documento                                       | Conteúdo                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `tasks/prd-controle-gastos-diarios/prd.md`      | Requisitos (RF1–RF40), histórias, critérios de aceitação e metas           |
| `tasks/prd-controle-gastos-diarios/techspec.md` | Arquitetura, modelo de dados, decisões técnicas e plano de testes (E2E-xx) |
| `tasks/prd-controle-gastos-diarios/task_*.md`   | Tarefas de implementação do MVP (todas entregues)                          |
| `PRODUCT.md`                                    | Público, posicionamento, restrições e voz da marca                         |
| `DESIGN.md` (+ `.impeccable/design.json`)       | Design system no padrão Apple/iOS: cores, tipografia, componentes, regras  |
| `todo-app.md`                                   | Pendências e melhorias sugeridas (marcar `[x]` ao concluir)                |

## Escopo

**O que o app faz (MVP entregue):**

- **Lançamentos:** valor, categoria, data (padrão hoje) e descrição opcional (até 80 caracteres); editar e excluir com confirmação. O botão "Lançar" fica visível em todas as telas principais. Ao salvar, o app mostra uma animação de confirmação e o resumo atualiza.
- **12 categorias fixas:** Alimentação, Mercado, Moradia, Transporte, Carro, Saúde, Educação, Lazer, Jogos, Vestuário, Família e Outros, cada uma com cor e ícone próprios (`src/domain/categories.ts`).
- **Resumo do mês:**
  - total gasto e comparação com o mês anterior;
  - bolhas proporcionais por categoria (peça de destaque, animada);
  - ranking das categorias com valor, percentual e quantidade de lançamentos;
  - navegação entre meses.
- **Orçamento:**
  - limite mensal por categoria e por carteira, que vale do mês escolhido em diante;
  - três estados: dentro (< 80%), alerta (80–100%) e estourado (> 100%), sempre com texto além da cor;
  - aviso no app ao entrar em alerta ou estourar;
  - anel de orçamento com o total do mês.
- **Carteiras:** separam contextos (Pessoal, Casa…). Há uma carteira padrão no primeiro uso, outras podem ser criadas, renomeadas e excluídas, e uma carteira de exemplo com dados fictícios pode ser carregada.
- **Planilhas `.xlsx`:**
  - exportar um arquivo por mês;
  - baixar uma planilha modelo;
  - importar mostrando antes uma prévia, as linhas descartadas e um aviso de conflito (substituir ou cancelar).
- **Local e offline:**
  - dados só no IndexedDB do aparelho;
  - instalável e offline depois da primeira carga;
  - tela de privacidade e opção de apagar tudo;
  - tela de erro clara se o armazenamento falhar.
- **Aparência:** tema Automático/Claro/Escuro em Mais → Aparência.

**Fora do escopo** (só com PRD novo): login e nuvem, receitas e saldo, categorias personalizadas, recorrentes e parcelados, metas, streaks e conquistas, notificações push, integrações bancárias, outros formatos de arquivo, apps nativos.

**Metas verificadas por testes:**

- o resumo atualiza em até 300 ms depois de salvar, com 5.000 lançamentos (E2E-03);
- nenhuma violação crítica de acessibilidade WCAG 2.1 AA (axe nos E2E);
- LCP de até 2,5 s no celular (Lighthouse);
- nenhum dado sai do aparelho.

## Stack

| Área         | Tecnologia                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Base         | React 19, TypeScript 6 (strict), Vite 8                                                                        |
| Rotas        | React Router 8 (`BrowserRouter`; telas secundárias com `lazy`)                                                 |
| Dados        | IndexedDB via Dexie 4 + `dexie-react-hooks` (`useLiveQuery`); validação com Zod 4                              |
| Estilo       | Tailwind CSS 4 (`@tailwindcss/vite`) sobre tokens CSS próprios; ícones `lucide-react`                          |
| Visualização | `d3-hierarchy` (empacotamento das bolhas) e `motion` (animações das bolhas, carregado sob demanda)             |
| Planilhas    | `read-excel-file` e `write-excel-file` (carregados sob demanda)                                                |
| PWA          | `vite-plugin-pwa` (Workbox), `workbox-window`                                                                  |
| Testes       | Vitest 5 + jsdom + Testing Library + `fake-indexeddb` + `fast-check`; Playwright 1.64 + `@axe-core/playwright` |
| Qualidade    | ESLint 10 (typescript-eslint, react-hooks), Prettier, Lighthouse CI 0.15.1                                     |
| Deploy       | Hospedagem estática (Netlify: `netlify.toml`); CI no GitHub Actions (`.github/workflows/`)                     |

Versões fixadas em `package.json` (sem `^`); Node.js ≥ 22.12.

## Comandos

| Comando                          | O que faz                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev`                    | Servidor de desenvolvimento na porta 5173                                                                   |
| `npm run build`                  | Typecheck + build de produção (com service worker)                                                          |
| `npm run preview`                | Serve o build na porta 5173                                                                                 |
| `npm run lint`                   | ESLint                                                                                                      |
| `npm run format`                 | Prettier em todo o projeto                                                                                  |
| `npm run typecheck`              | `tsc --noEmit`                                                                                              |
| `npm test`                       | Testes de unidade e integração (Vitest, jsdom, fake-indexeddb)                                              |
| `npm run test:coverage`          | Testes com cobertura (falha abaixo de 80% de linhas e branches em `src/domain/` e `src/data/`)              |
| `npm run test:e2e`               | Playwright contra o build servido por `vite preview` na porta 5180 (`E2E_PORT` muda), com a CSP de produção |
| `npx @lhci/cli@0.15.1 autorun`   | Lighthouse CI sobre `dist/` (rode `npm run build` antes; limites em `lighthouserc.json`)                    |
| `node scripts/make-fixtures.mjs` | Regenera as planilhas de `tests/fixtures/`                                                                  |
| `node scripts/make-icons.mjs`    | Regenera os ícones PNG do PWA a partir de `public/favicon.svg`                                              |

Antes de entregar uma mudança: `npm run typecheck`, `npm run lint`, `npx prettier --check .`, `npm test` e, se mexeu em tela, `npm run test:e2e`.

## Ambiente desta máquina

- Node.js 22 portátil em `%LOCALAPPDATA%\Programs\node22`, fora do PATH. No PowerShell, prefixe `$env:Path="$env:LOCALAPPDATA\Programs\node22;$env:Path"`.
- O disco C: está quase cheio. Antes de rodar testes ou o Playwright, aponte os navegadores e a pasta temporária para o projeto (ignorado pelo git):

  ```powershell
  $env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.cache\ms-playwright"
  $env:TEMP = $env:TMP = "$PWD\.cache\tmp"
  ```

- Portas na faixa 51xx: dev e preview 5173, E2E 5180 (capturas avulsas usaram 5181). Verifique se a porta está livre antes de subir um servidor e pare-o ao terminar. Não há backend nem banco externo.

## Estrutura de pastas

```
src/
  main.tsx, App.tsx      entrada: aplica o tema, abre o banco (Boot), onboarding, rotas
  pwa.ts                 registro do service worker e aviso de nova versão
  domain/                regras puras: money, dates, categories, summary, budget, comparison,
                         expenseSchema (Zod), importRules, walletName, bubbleLayout, types
  data/                  db.ts (Dexie), *Repository.ts, storageGuard (abertura, cota, persistência),
                         xlsxAdapter (ler/gravar planilhas), sampleData (carteira de exemplo)
  hooks/                 useActiveWallet, useMonthExpenses, useMonthSummary, useBudgets,
                         useSaveExpense (grava + avisos + evento de "salvo"), useReducedMotionPref
  features/
    app/                 AppShell (abas + Lançar), AppState, Toaster, SaveCelebration,
                         ErrorBoundary, StorageErrorScreen, UpdatePrompt
    summary/             SummaryPage, MonthTotalCard, CategoryBubbles, CategoryRanking,
                         BudgetOverview (anel), MonthSwitcher, AnimatedMoney
    expenses/            ExpenseList (aba Lançamentos), ExpenseFormSheet, CategoryPicker,
                         ExpenseFormContext (abre o formulário de qualquer tela)
    budget/              BudgetPage, BudgetRow, BudgetEditor, budgetText
    wallets/             WalletSwitcher, WalletManager
    transfer/            ExportPanel, ImportWizard, TemplateDownload, WalletSelect
    settings/            MorePage (aba Mais) + moreRoutes, AppearanceSection, AboutPrivacy,
                         WipeData, ExportReminder
    onboarding/          Welcome (3 passos)
  ui/                    componentes base: Button, Sheet (Modal), ConfirmDialog, Field, MoneyInput,
                         PageHeader, Grouped (listas agrupadas), ProgressBar, CategoryIcon, EmptyState
  lib/                   errors (AppError), log, perf, format, id, download, theme
  styles/                tokens.css (cores claro/escuro), index.css (Tailwind, tipografia, animações),
                         contrast.test.ts
  test/                  setup.ts e factories.ts do Vitest
tests/e2e/               specs Playwright (E2E-01…E2E-14, acessibilidade, aparência) + helpers.ts
tests/fixtures/          planilhas .xlsx de teste (geradas por scripts/make-fixtures.mjs)
public/                  favicon.svg (fonte dos ícones), PNGs do PWA, theme-init.js
scripts/                 make-fixtures.mjs, make-icons.mjs
tasks/                   PRD, TechSpec e tarefas
.claude/skills/          fluxo de trabalho: criar-prd, criar-techspec, criar-tasks,
                         executar-task, executar-review, executar-qa
.impeccable/             contexto da skill de design (config, briefs, capturas de revisão)
security-headers.mjs     CSP e cabeçalhos (usados no preview/E2E; espelhados em netlify.toml)
```

## Arquitetura

As dependências vão numa só direção: `domain` ← `data` ← `hooks` ← `features`/`ui`.

- **`domain/`** só tem funções puras e testáveis, sem React nem IndexedDB. Todo cálculo de dinheiro, datas, resumo, orçamento e importação mora aqui.
- **`data/`** é o único lugar que toca o Dexie. Os repositórios validam a entrada com o domínio e lançam `AppError` com uma mensagem para o usuário.
- **`hooks/`** juntam `useLiveQuery` e o domínio. As telas reagem sozinhas a qualquer gravação, sem um estado global de dados.
- **`features/`** contém as telas, e **`ui/`** os componentes sem regra de negócio.

**Modelo de dados** (`src/data/db.ts`, Dexie versão 1; qualquer mudança exige `version(n+1)` com `upgrade()`):

- `wallets`: `id, createdAt`.
- `expenses`: `id, walletId, [walletId+month], [walletId+month+categoryId]`. O campo `month` (`YYYY-MM`) fica gravado para permitir consultas por índice.
- `budgets`: `id, walletId, [walletId+categoryId]`. O limite vale a partir de um mês, e o mais recente que for menor ou igual ao mês consultado é o que vale.
- `settings`: um registro só (`id: 'app'`), com carteira ativa, onboarding e persistência.

**Telas:** quatro abas, Resumo (`/`), Lançamentos (`/lancamentos`), Orçamento (`/orcamento`) e Mais (`/mais/*`).

- Resumo e Lançamentos vêm no pacote inicial; o resto é carregado com `lazy`.
- O formulário de lançamento é uma sheet aberta por `ExpenseFormContext`.
- Depois de salvar, `useSaveExpense` dispara o evento `gastos:expense-saved` (com categoria, valor e se o lançamento é novo). O botão Lançar e o `SaveCelebration` reagem a ele.

## Convenções

**Dados e formatos**

- Dinheiro sempre em **centavos inteiros**; formatação só na borda (`formatMoney`).
- Datas como string `YYYY-MM-DD` no horário local e meses como `YYYY-MM`. Nunca use `new Date('YYYY-MM-DD')`, porque vira UTC.
- Campos opcionais ausentes são gravados como `null`, nunca `undefined`.
- Textos de UI em pt-BR, simples e positivos ao falar de limites; moeda `R$ 1.234,56`; datas `dd/mm/aaaa`. Estados vazios sempre com orientação e ação.

**Privacidade e segurança**

- O logger nunca registra valores, descrições ou nomes de carteira.
- Nenhum dado sai do aparelho: sem `fetch` de dados, CSP `connect-src 'self'`.
- A CSP é estrita, sem `'unsafe-inline'`. Os cabeçalhos estão em `security-headers.mjs` e espelhados em `netlify.toml`; `src/deploy.test.ts` confere os dois.
  - Script inline é proibido: o que precisa rodar antes do app vai num arquivo em `public/`, como `theme-init.js`.
  - Atributos `style` não podem ficar em HTML estático. Os `style` do React são permitidos, porque passam pelo CSSOM.
  - Evite `<select>` nativo: alguns WebKit injetam um estilo que a CSP bloqueia.

**Desempenho**

- Telas fora do Resumo e dos Lançamentos e as bibliotecas de planilha e de animação são carregadas sob demanda. Mantenha o pacote inicial enxuto.

**Visual e acessibilidade** (detalhes em `DESIGN.md`)

- Cores só via tokens de `src/styles/tokens.css`.
  - Há tema claro, escuro do sistema e escuro escolhido (`data-theme` no `<html>`).
  - O bloco escuro aparece duas vezes no arquivo. Altere as duas cópias: `contrast.test.ts` confere que são iguais e mede o contraste.
  - A cor nunca é o único identificador.
- Padrão visual Apple/iOS: tipografia de sistema (escala `text-large-title` … `text-caption2`), listas agrupadas (`ui/Grouped`), sheets com alça, barras translúcidas (`.material`), títulos grandes (`PageHeader`) e números com `.figure`.
- Animações respeitam "reduzir movimento". A regra global de `index.css` desliga as animações CSS; em JS, verifique `prefers-reduced-motion` (ou use `useReducedMotionPref`).
- Acessibilidade WCAG 2.1 AA:
  - foco visível;
  - alvos de toque de pelo menos 44 px;
  - modais com foco preso e Esc;
  - grupos de opções com `role="radiogroup"` e navegação por setas.

**Testes**

- Testes de unidade ficam ao lado do código (`*.test.ts(x)`), os E2E em `tests/e2e/` e as fixtures em `tests/fixtures/`.

**Ferramentas de edição**

- Escapes `\uXXXX` em strings viram o caractere literal. Use `String.fromCharCode` ou classes Unicode (`\p{M}`).

## Testes e qualidade

- **Vitest:** domínio, repositórios (com `fake-indexeddb`) e componentes. Há testes por propriedades (`fast-check`) para o resumo e as bolhas.
- **Playwright:** três projetos, `chromium-mobile` (390×844), `chromium-desktop` e `webkit-mobile`.
  - Rodam contra o build de produção com a CSP real.
  - Os IDs E2E-01…E2E-14 seguem o plano de testes da TechSpec.
  - `helpers.ts` tem `openApp` (pula o onboarding), `seed` (grava direto no IndexedDB) e `goTab`.
- **Lighthouse** (`lighthouserc.json`): LCP ≤ 2,5 s e acessibilidade ≥ 0,95 são obrigatórios; FCP, TBT e boas práticas só geram aviso.
- **CI** (`.github/workflows/`): lint, typecheck, cobertura e build em dois fusos (`America/Sao_Paulo` e `UTC`), depois E2E e Lighthouse.

## Armadilhas conhecidas

- **CI e a branch principal:** o workflow roda em `push` para `main` e em pull requests, mas a branch principal é `master`. Push direto em `master` não dispara a CI.
- **Datas de criação empatadas:** registros criados no mesmo milissegundo empatam em `createdAt`. Testes não devem depender da ordem de `orderBy('createdAt')` nesses casos.
- **Teclado do iOS:** o teclado não encolhe o layout, só a área visível. `ui/Sheet.tsx` acompanha `visualViewport` para a sheet ficar acima do teclado. Não volte a usar `dvh` ou `inset-0` puro na altura das sheets.
- **Campo de data nativo:** o formato segue o idioma do navegador, não o app.
- **Teste de desempenho no E2E:** o E2E-03 (300 ms) pode falhar com a máquina carregada pela suíte inteira. Rode-o sozinho antes de concluir que houve regressão.

## Git

- Trabalho na branch `develop`; a principal é `master`.
- Só faça commit quando pedirem.
