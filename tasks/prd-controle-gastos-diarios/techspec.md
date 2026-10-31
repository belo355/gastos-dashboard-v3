# Especificação técnica

**Funcionalidade:** Controle de Gastos Diários — ver [`prd.md`](./prd.md)
**Data:** 2026-10-29

## Resumo

A solução é uma SPA estática em **React 19 + TypeScript + Vite**, empacotada como **PWA** (`vite-plugin-pwa`/Workbox) e publicada em hospedagem estática com HTTPS (Netlify ou Vercel). Não há backend: todos os dados (carteiras, lançamentos, orçamentos e preferências) ficam no **IndexedDB** do navegador, acessado via **Dexie 4**, com consultas reativas (`useLiveQuery`) que atualizam o resumo automaticamente após cada gravação. O app solicita armazenamento persistente (`navigator.storage.persist()`) e funciona offline após o primeiro carregamento.

A arquitetura é organizada em três camadas com dependências em uma só direção: **domínio** (funções puras de cálculo — dinheiro, resumo, percentuais, orçamento, comparação mensal, normalização de importação), **dados** (repositórios Dexie e adaptador `.xlsx`) e **UI** (features React). Valores monetários são sempre **inteiros em centavos** e datas são strings `YYYY-MM-DD` sem fuso horário, eliminando erros de ponto flutuante e de virada de dia. O resumo lúdico usa **bolhas proporcionais** (layout `d3-hierarchy` `pack`, área ∝ valor) animadas com **Motion**, com o ranking em lista como equivalente acessível. Importação e exportação `.xlsx` usam `read-excel-file`/`write-excel-file`, carregadas sob demanda (`import()` dinâmico) para não pesar na carga inicial.

## Arquitetura do sistema

### Visão dos componentes

Todos os componentes são novos (projeto greenfield).

**Domínio (`src/domain/`) — puro, sem React nem IndexedDB**

- `money` — conversão `string pt-BR ⇄ centavos` e formatação `R$ 1.234,56` (`Intl.NumberFormat('pt-BR', { currency: 'BRL' })`).
- `dates` — `today()`, `monthKey(date)`, `addMonths`, `formatMonthLabel` ("Outubro 2026"), validação `YYYY-MM-DD`, conversão de datas do Excel.
- `categories` — catálogo fixo das 12 categorias (id, nome, ícone, token de cor) e `matchCategory(texto)` (minúsculas, sem acento).
- `summary` — `summarizeMonth(expenses)`: total, agrupamento por categoria, contagem, ranking e percentuais pelo **método do maior resto** (a soma é exatamente 100,0%).
- `budget` — `resolveBudgets(records, month)` (vigência por mês) e `budgetStatus(spent, limit)` → `ok | warning | over`, com restante/excedente; `detectThresholdCrossing(before, after)`.
- `comparison` — `compareMonths(current, previous)`: delta em centavos, delta % (nulo quando o mês anterior é zero) e direção.
- `importRules` — `normalizeRows(rows)`: localiza colunas pelo cabeçalho, valida cada linha e produz `ImportPreview`.
- `bubbleLayout` — `layoutBubbles(items, width, height)`: wrapper de `d3-hierarchy` `pack` que devolve círculos posicionados.

**Dados (`src/data/`)**

- `db` — instância Dexie `GastosDB` com o esquema versionado e as migrações.
- `walletRepository`, `expenseRepository`, `budgetRepository`, `settingsRepository` — CRUD e consultas por carteira e mês; gravações em transação.
- `storageGuard` — `requestPersistence()`, detecção de IndexedDB indisponível e tradução de exceções Dexie para `AppError`.
- `xlsxAdapter` — `parseWorkbook(file)` (primeira aba → matriz de células) e `buildMonthWorkbook(expenses)` (→ `Blob`), com carregamento dinâmico das bibliotecas.
- `sampleData` — gerador da carteira de exemplo com dados fictícios.

**UI (`src/features/`, `src/ui/`)**

- `app/` — `AppShell` (navegação inferior: Resumo, Lançamentos, Orçamento, Mais), `LaunchButton` flutuante, roteador, `ErrorBoundary`, `Toaster` (`aria-live`), provedor de tema e de carteira ativa.
- `features/summary/` — `SummaryPage`, `MonthSwitcher`, `MonthTotalCard` (total + comparação), `CategoryBubbles` (SVG + Motion), `CategoryRanking` (lista acessível), `BudgetOverview`.
- `features/expenses/` — `ExpenseFormSheet` (criar/editar), `CategoryPicker` (grade de ícones), `ExpenseList` (filtro por categoria), `ConfirmDialog`.
- `features/budget/` — `BudgetPage`, `BudgetRow` (barra de progresso com três estados), `BudgetEditor`.
- `features/wallets/` — `WalletSwitcher`, `WalletManager` (criar, renomear, excluir).
- `features/transfer/` — `ExportPanel`, `ImportWizard` (escolher → prévia → conflito → confirmar), `TemplateDownload`.
- `features/onboarding/` — `Welcome` (até 3 passos, aviso de privacidade, opção de exemplo).
- `features/settings/` — `AboutPrivacy`, `WipeData`.
- `ui/` — componentes base (`Button`, `Sheet`, `Dialog`, `ProgressBar`, `MoneyInput`, `EmptyState`) e tokens de design.

**Hooks de aplicação (`src/hooks/`)** — `useActiveWallet`, `useMonthSummary(walletId, month)`, `useMonthExpenses`, `useBudgets(walletId, month)`, `useSaveExpense` (grava e dispara o aviso de orçamento), `useReducedMotionPref`.

**Fluxo de dados**

```
Ação do usuário ─► Hook de mutação ─► Repositório (transação Dexie) ─► IndexedDB
                                                                         │
UI (bolhas, ranking, barras) ◄─ funções de domínio ◄─ useLiveQuery ◄────┘
```

1. O usuário salva um lançamento → `useSaveExpense` valida com zod, lê o estado do orçamento da categoria (antes), grava via `expenseRepository.create`, recalcula (depois) e, se `detectThresholdCrossing` indicar mudança para `warning`/`over`, publica um toast.
2. `useLiveQuery` reexecuta as consultas do mês afetado; `summarizeMonth`, `resolveBudgets` e `compareMonths` derivam os dados de tela em memória (memoizados); as bolhas animam para o novo layout.
3. Importação: `File` → `xlsxAdapter.parseWorkbook` → `importRules.normalizeRows` → `ImportPreview` exibida → conflito de mês resolvido pelo usuário → `expenseRepository.replaceMonths` em uma única transação.
4. Exportação: `expenseRepository.listByMonth` → `xlsxAdapter.buildMonthWorkbook` → download (`URL.createObjectURL`), um arquivo por mês.

## Design de implementação

### Principais interfaces

```ts
// src/data/repositories.ts
interface WalletRepository {
  list(): Promise<Wallet[]>;
  create(name: string): Promise<Wallet>;            // AppError 'wallet_name_taken' | 'invalid_name'
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;                 // apaga lançamentos e orçamentos em cascata
}
interface ExpenseRepository {
  listByMonth(walletId: string, month: MonthKey): Promise<Expense[]>;
  monthsWithData(walletId: string): Promise<MonthKey[]>;
  create(input: ExpenseInput): Promise<Expense>;
  update(id: string, input: ExpenseInput): Promise<void>;
  remove(id: string): Promise<void>;
  replaceMonths(walletId: string, byMonth: Map<MonthKey, ExpenseInput[]>): Promise<void>;
}
interface BudgetRepository {
  listForWallet(walletId: string): Promise<BudgetRecord[]>;
  setLimit(walletId: string, categoryId: CategoryId, from: MonthKey, cents: number | null): Promise<void>;
}
```

```ts
// src/domain — funções puras
summarizeMonth(expenses: Expense[]): MonthSummary
compareMonths(currentCents: number, previousCents: number): MonthComparison
resolveBudgets(records: BudgetRecord[], month: MonthKey): Map<CategoryId, number>
budgetStatus(spentCents: number, limitCents: number): BudgetProgress
detectThresholdCrossing(before: BudgetProgress, after: BudgetProgress): 'warning' | 'over' | null
normalizeRows(rows: unknown[][], existingMonths: MonthKey[]): ImportPreview
parseMoney(text: string): number | null  // "1.234,56" -> 123456
formatMoney(cents: number): string       // 123456 -> "R$ 1.234,56"
layoutBubbles(items: CategoryTotal[], w: number, h: number): BubbleNode[]
```

```ts
// src/data/xlsxAdapter.ts
interface XlsxAdapter {
  parseWorkbook(file: File): Promise<unknown[][]>;      // primeira aba; AppError 'import_unreadable'
  buildMonthWorkbook(expenses: Expense[]): Promise<Blob>;
  buildTemplate(): Promise<Blob>;
}
```

### Modelos de dados

Convenções gerais: identificadores são `crypto.randomUUID()`; valores monetários são inteiros em **centavos** (`number`, ≥ 0); datas são `string` `YYYY-MM-DD` no horário local; meses são `MonthKey` = `string` `YYYY-MM`; instantes de auditoria são ISO 8601. Campos opcionais ausentes são armazenados como `null` (nunca `undefined`), para que os índices e a exportação sejam previsíveis.

#### `Wallet` — carteira (tabela `wallets`)

| Campo       | Tipo      | Obrigatório | Descrição                                                         |
| ----------- | --------- | ----------- | ----------------------------------------------------------------- |
| `id`        | `string`  | sim         | UUID, chave primária.                                             |
| `name`      | `string`  | sim         | 1–40 caracteres, aparado; único sem diferenciar maiúsculas/acentos. |
| `isSample`  | `boolean` | sim         | `true` para a carteira de dados fictícios do onboarding.          |
| `createdAt` | `string`  | sim         | ISO 8601.                                                         |

```text
{
  "id": "6f1c2a7e-3b9d-4f0a-9a51-2d8e4c1b7a90",
  "name": "Pessoal",
  "isSample": false,
  "createdAt": "2026-10-29T12:03:11.000Z"
}
```

#### `Expense` — lançamento de despesa (tabela `expenses`)

| Campo         | Tipo             | Obrigatório | Descrição                                               |
| ------------- | ---------------- | ----------- | ------------------------------------------------------- |
| `id`          | `string`         | sim         | UUID, chave primária.                                   |
| `walletId`    | `string`         | sim         | Carteira dona do lançamento.                            |
| `date`        | `string`         | sim         | `YYYY-MM-DD`.                                           |
| `month`       | `MonthKey`       | sim         | Derivado de `date`; usado nos índices.                  |
| `categoryId`  | `CategoryId`     | sim         | Uma das 12 categorias fixas.                            |
| `amountCents` | `number`         | sim         | Inteiro > 0, máximo 99.999.999 (R$ 999.999,99).         |
| `description` | `string \| null` | não         | Até 80 caracteres; `null` quando vazio.                 |
| `createdAt`   | `string`         | sim         | ISO 8601; desempate de ordenação no mesmo dia.          |
| `updatedAt`   | `string`         | sim         | ISO 8601.                                               |

Índices Dexie: `id, walletId, [walletId+month], [walletId+month+categoryId]`.

```text
{
  "id": "b2d4f1e0-8c3a-4a7b-9e21-0f6d5c4b3a21",
  "walletId": "6f1c2a7e-3b9d-4f0a-9a51-2d8e4c1b7a90",
  "date": "2026-10-29",
  "month": "2026-10",
  "categoryId": "alimentacao",
  "amountCents": 2590,
  "description": "Almoço",
  "createdAt": "2026-10-29T12:10:42.000Z",
  "updatedAt": "2026-10-29T12:10:42.000Z"
}
```

#### `ExpenseInput` — entrada de criação/edição (validada com zod)

| Campo         | Tipo             | Obrigatório | Descrição                                                    |
| ------------- | ---------------- | ----------- | ------------------------------------------------------------ |
| `walletId`    | `string`         | sim         | Carteira ativa.                                              |
| `date`        | `string`         | sim         | `YYYY-MM-DD` válido; padrão: hoje. Erro: "Data inválida".    |
| `categoryId`  | `CategoryId`     | sim         | Erro: "Escolha uma categoria".                               |
| `amountCents` | `number`         | sim         | > 0. Erro: "Informe o valor".                                |
| `description` | `string \| null` | não         | Aparada; vazia vira `null`; > 80 caracteres é rejeitada.     |

```text
{
  "walletId": "6f1c2a7e-3b9d-4f0a-9a51-2d8e4c1b7a90",
  "date": "2026-10-29",
  "categoryId": "mercado",
  "amountCents": 5000,
  "description": null
}
```

#### `Category` — catálogo fixo (constante em código, não persistido)

| Campo      | Tipo         | Obrigatório | Descrição                                                    |
| ---------- | ------------ | ----------- | ------------------------------------------------------------ |
| `id`       | `CategoryId` | sim         | Slug estável usado na persistência e na planilha.            |
| `name`     | `string`     | sim         | Rótulo exibido.                                              |
| `icon`     | `string`     | sim         | Nome do ícone `lucide-react`.                                |
| `colorVar` | `string`     | sim         | Token CSS com variantes claro/escuro validadas para contraste. |

Ids: `alimentacao`, `mercado`, `moradia`, `transporte`, `carro`, `saude`, `educacao`, `lazer`, `jogos`, `vestuario`, `familia`, `outros`.

```text
{ "id": "mercado", "name": "Mercado", "icon": "ShoppingCart", "colorVar": "--cat-mercado" }
```

#### `BudgetRecord` — limite mensal com vigência (tabela `budgets`)

Implementa o RF20 ("vale para o mês corrente e os seguintes até ser alterado") sem reescrever o histórico: cada alteração cria ou substitui o registro a partir de um mês; o limite de um mês M é o registro com o maior `effectiveFrom ≤ M`.

| Campo           | Tipo             | Obrigatório | Descrição                                                      |
| --------------- | ---------------- | ----------- | -------------------------------------------------------------- |
| `id`            | `string`         | sim         | `${walletId}:${categoryId}:${effectiveFrom}` (idempotente).    |
| `walletId`      | `string`         | sim         | Carteira.                                                      |
| `categoryId`    | `CategoryId`     | sim         | Categoria.                                                     |
| `effectiveFrom` | `MonthKey`       | sim         | Mês selecionado na tela de orçamento ao salvar.                |
| `limitCents`    | `number \| null` | sim         | Inteiro > 0; `null` significa "limite removido" a partir deste mês. |

Índices: `id, walletId, [walletId+categoryId]`.

```text
{
  "id": "6f1c2a7e-3b9d-4f0a-9a51-2d8e4c1b7a90:mercado:2026-10",
  "walletId": "6f1c2a7e-3b9d-4f0a-9a51-2d8e4c1b7a90",
  "categoryId": "mercado",
  "effectiveFrom": "2026-10",
  "limitCents": 50000
}
```

#### `Settings` — preferências locais (tabela `settings`, chave única `"app"`)

| Campo                | Tipo                            | Obrigatório | Descrição                                    |
| -------------------- | ------------------------------- | ----------- | -------------------------------------------- |
| `id`                 | `"app"`                         | sim         | Chave fixa.                                  |
| `activeWalletId`     | `string`                        | sim         | Carteira ativa.                              |
| `onboardingDone`     | `boolean`                       | sim         | Exibe ou não o `Welcome`.                    |
| `persistenceGranted` | `boolean \| null`               | sim         | Resultado de `navigator.storage.persist()`; `null` se a API não existir. |
| `lastExportAt`       | `string \| null`                | sim         | Usado para lembrar o usuário de exportar (aviso no "Mais" após 30 dias). |

```text
{
  "id": "app",
  "activeWalletId": "6f1c2a7e-3b9d-4f0a-9a51-2d8e4c1b7a90",
  "onboardingDone": true,
  "persistenceGranted": true,
  "lastExportAt": null
}
```

#### `MonthSummary` — resultado de `summarizeMonth` (pronto para exibição)

| Campo                     | Tipo              | Obrigatório | Descrição                                                 |
| ------------------------- | ----------------- | ----------- | --------------------------------------------------------- |
| `totalCents`              | `number`          | sim         | Soma do mês.                                              |
| `count`                   | `number`          | sim         | Quantidade de lançamentos.                                |
| `categories`              | `CategoryTotal[]` | sim         | Somente categorias com gasto, ordenadas por valor desc (desempate: nome). |
| `categories[].categoryId` | `CategoryId`      | sim         | Categoria.                                                |
| `categories[].totalCents` | `number`          | sim         | Soma da categoria.                                        |
| `categories[].count`      | `number`          | sim         | Lançamentos da categoria.                                 |
| `categories[].percent`    | `number`          | sim         | Uma casa decimal; soma exata de 100,0 pelo método do maior resto. |
| `categories[].rank`       | `number`          | sim         | Posição 1..n.                                             |

```text
{
  "totalCents": 184590,
  "count": 23,
  "categories": [
    { "categoryId": "mercado", "totalCents": 82000, "count": 6, "percent": 44.4, "rank": 1 },
    { "categoryId": "transporte", "totalCents": 51290, "count": 9, "percent": 27.8, "rank": 2 },
    { "categoryId": "lazer", "totalCents": 51300, "count": 8, "percent": 27.8, "rank": 3 }
  ]
}
```

> **Mês sem lançamentos:** `categories` é lista vazia e a UI exibe o estado vazio com a ação "Lançar".

```text
{ "totalCents": 0, "count": 0, "categories": [] }
```

#### `MonthComparison` — resultado de `compareMonths`

| Campo          | Tipo                                  | Obrigatório | Descrição                                       |
| -------------- | ------------------------------------- | ----------- | ----------------------------------------------- |
| `deltaCents`   | `number`                              | sim         | Atual − anterior (pode ser negativo).           |
| `deltaPercent` | `number \| null`                      | sim         | Uma casa decimal; `null` se o anterior for 0.   |
| `direction`    | `"more" \| "less" \| "equal" \| "no_previous"` | sim | Determina o texto "gastou mais/menos".   |

```text
{ "deltaCents": -12000, "deltaPercent": -6.1, "direction": "less" }
```

> **Sem mês anterior:** com anterior = 0, a UI omite o percentual e mostra "Primeiro mês com gastos".

```text
{ "deltaCents": 184590, "deltaPercent": null, "direction": "no_previous" }
```

#### `BudgetProgress` — resultado de `budgetStatus`

| Campo            | Tipo                            | Obrigatório | Descrição                                          |
| ---------------- | ------------------------------- | ----------- | -------------------------------------------------- |
| `spentCents`     | `number`                        | sim         | Gasto da categoria no mês.                         |
| `limitCents`     | `number`                        | sim         | Limite vigente.                                    |
| `ratio`          | `number`                        | sim         | `spent / limit` (sem teto; a barra visual satura em 100%). |
| `status`         | `"ok" \| "warning" \| "over"`   | sim         | `ok` < 0,80 ≤ `warning` ≤ 1,00 < `over`.           |
| `remainingCents` | `number`                        | sim         | `max(limit − spent, 0)`.                           |
| `excessCents`    | `number`                        | sim         | `max(spent − limit, 0)`.                           |

```text
{ "spentCents": 53000, "limitCents": 50000, "ratio": 1.06, "status": "over", "remainingCents": 0, "excessCents": 3000 }
```

#### `ImportPreview` — resultado de `normalizeRows`

| Campo              | Tipo                              | Obrigatório | Descrição                                                   |
| ------------------ | --------------------------------- | ----------- | ----------------------------------------------------------- |
| `valid`            | `ExpenseInput[]` (sem `walletId`) | sim         | Linhas aceitas.                                             |
| `discarded`        | `{ row: number; reason: ImportRowError }[]` | sim | Linhas rejeitadas (número da linha na planilha, base 1). |
| `blankRows`        | `number`                          | sim         | Linhas em branco ignoradas (não contam como descartadas).   |
| `remappedToOthers` | `number`                          | sim         | Linhas válidas cuja categoria não foi reconhecida.          |
| `months`           | `MonthKey[]`                      | sim         | Meses detectados, ordenados.                                |
| `conflicts`        | `MonthKey[]`                      | sim         | Meses detectados que já têm lançamentos na carteira.        |

`ImportRowError`: `invalid_date`, `invalid_amount`, `description_too_long`.

```text
{
  "valid": [ { "date": "2026-10-03", "categoryId": "outros", "amountCents": 1500, "description": "Papelaria" } ],
  "discarded": [ { "row": 9, "reason": "invalid_date" } ],
  "blankRows": 2,
  "remappedToOthers": 1,
  "months": ["2026-10"],
  "conflicts": ["2026-10"]
}
```

#### `AppError` — envelope de erro interno

Não há HTTP; o "status" é a ação de UI correspondente.

| Código                    | HTTP | Significado / mensagem exibida                                                   |
| ------------------------- | ---- | -------------------------------------------------------------------------------- |
| `storage_unavailable`     | —    | IndexedDB indisponível. "Não foi possível salvar no aparelho. Tente de novo."    |
| `storage_quota`           | —    | Cota excedida. "O espaço do aparelho acabou. Exporte e apague meses antigos."    |
| `wallet_name_taken`       | —    | "Já existe uma carteira com esse nome".                                          |
| `invalid_name`            | —    | "Informe o nome da carteira".                                                    |
| `import_unreadable`       | —    | Arquivo corrompido ou não `.xlsx`. "Não foi possível ler a planilha."            |
| `import_missing_columns`  | —    | Cabeçalho sem `data`, `categoria` ou `valor`. Lista as colunas ausentes.         |
| `import_duplicate_month`  | —    | Dois arquivos do mesmo mês na mesma importação. "Duas planilhas do mesmo mês."   |
| `import_too_large`        | —    | Arquivo > 5 MB ou > 10.000 linhas.                                               |
| `import_empty`            | —    | "Nenhuma despesa encontrada nesta planilha."                                     |
| `export_failed`           | —    | "Não foi possível gerar o arquivo. Tente de novo."                               |

```text
{
  "error": {
    "code": "wallet_name_taken",
    "message": "Já existe uma carteira com esse nome"
  }
}
```

#### Mapeamento planilha `.xlsx` → `ExpenseInput`

Cabeçalhos são comparados após normalização (minúsculas, sem acento, aparados), em qualquer ordem, na **primeira aba**; colunas extras são ignoradas. A exportação gera exatamente os cabeçalhos da coluna "Origem" e é reimportável sem perdas.

| Origem (planilha)      | Destino (contrato) | Regra                                                                                     |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `Data`                 | `date`             | Célula de data, número serial do Excel ou texto `dd/mm/aaaa`/`aaaa-mm-dd`; senão `invalid_date`. |
| `Descrição`/`Descricao`| `description`      | Texto aparado; vazio → `null`; > 80 caracteres → `description_too_long`.                  |
| `Categoria`            | `categoryId`       | Comparado com nome e id normalizados; não reconhecido ou vazio → `outros`.                |
| `Valor` / `Valor (R$)` | `amountCents`      | Número ou texto pt-BR (`1.234,56`, `R$ 25,90`); ≤ 0 ou ilegível → `invalid_amount`.       |

Exportação: cada arquivo se chama `gastos-<carteira-slug>-<YYYY-MM>.xlsx`, com a data como célula de data (`dd/mm/aaaa`), o valor como número com formato `#,##0.00` e as linhas ordenadas por data crescente.

### Endpoints da API (se aplicável)

Não aplicável. O app não expõe nem consome APIs; o único tráfego de rede é o download dos arquivos estáticos do próprio app (HTML, JS, CSS, ícones e manifest) servidos pelo host e cacheados pelo service worker.

## Pontos de integração

Não há integrações externas em tempo de execução. Dependências da plataforma do navegador e seu tratamento:

- **IndexedDB (via Dexie):** em navegação privada, quando bloqueado ou com a cota cheia, `storageGuard` converte a exceção em `storage_unavailable`/`storage_quota`; o formulário preserva os dados digitados (CA-20). Na abertura, se o banco não abrir, o app mostra uma tela de erro com instrução em vez de falhar silenciosamente.
- **Storage API (`navigator.storage.persist()`):** solicitada após o primeiro lançamento salvo, por ser mais provável de ser concedida com interação. O resultado fica em `Settings.persistenceGranted`; quando negada, a tela "Privacidade" reforça a recomendação de exportar.
- **Service Worker (Workbox via `vite-plugin-pwa`):** `registerType: 'prompt'` — quando há nova versão, um toast oferece "Atualizar". Precache de todos os assets; `navigateFallback: '/index.html'` para as rotas da SPA offline.
- **Hospedagem estática (Netlify/Vercel):** regra de rewrite `/* → /index.html` e cabeçalhos `Cache-Control: no-cache` para `index.html` e `sw.js`. Content-Security-Policy restritiva (`default-src 'self'`; `connect-src 'self'`), o que também impede o envio de dados a terceiros.
- **Download de arquivos:** `Blob` + `<a download>`. No iOS (PWA instalado), quando disponível, usa `navigator.share({ files })` como alternativa.

## Abordagem de testes

Ferramentas: **Vitest** (unidade e integração, ambiente `jsdom`, `fake-indexeddb` para o Dexie), **React Testing Library** (integração de componentes), **Playwright** com **@axe-core/playwright** (E2E e acessibilidade, Chromium e WebKit, viewport mobile 390×844 e desktop). **Meta de cobertura: 80% de linhas e branches em `src/domain/` e `src/data/`** (medida com `@vitest/coverage-v8`; o CI falha abaixo disso). A UI é coberta pelos testes de integração e E2E, sem meta numérica.

### Testes de unidade (se aplicável)

| ID    | Nome do caso de teste                                         | Critérios de aceitação | Resultado esperado |
|-------|---------------------------------------------------------------|------------------------|--------------------|
| TU-01 | `parseMoney` aceita formatos pt-BR                            | CA-01, CA-02           | `"25,90"→2590`, `"1.234,56"→123456`, `"R$ 5"→500`; `""`, `"0"`, `"abc"`, `"-3"` → `null`. |
| TU-02 | `formatMoney` formata em BRL                                  | CA-09                  | `123456→"R$ 1.234,56"`, `0→"R$ 0,00"`. |
| TU-03 | Schema de `ExpenseInput` valida campos                        | CA-02                  | Valor ausente/zero → "Informe o valor"; data `2026-02-30` → "Data inválida"; descrição com 81 caracteres rejeitada. |
| TU-04 | `summarizeMonth` agrega, ordena e conta                       | CA-04, CA-05           | Totais por categoria corretos, ranking desc com desempate por nome e soma dos totais = `totalCents`. |
| TU-05 | Percentuais pelo maior resto somam 100,0                      | CA-05                  | Para 3 categorias iguais: 33,4 / 33,3 / 33,3; para quaisquer entradas aleatórias (teste de propriedade), a soma é 100,0. |
| TU-06 | `summarizeMonth` com lista vazia                              | CA-04                  | `{ totalCents: 0, count: 0, categories: [] }`. |
| TU-07 | `compareMonths` cobre mais, menos, igual e sem anterior       | CA-07                  | `(184590, 196590)` → `-12000`, `-6.1`, `less`; anterior 0 → `deltaPercent: null`, `no_previous`. |
| TU-08 | `budgetStatus` aplica as faixas                               | CA-09, CA-10           | 32000/50000 → `ok`, ratio 0,64, restam 18000; 43000 → `warning` (0,86); 50000 → `warning`; 53000 → `over`, excesso 3000. |
| TU-09 | `detectThresholdCrossing` só dispara ao mudar de faixa        | CA-10                  | `ok→warning` = `warning`; `warning→over` = `over`; `warning→warning` e `over→over` = `null`. |
| TU-10 | `resolveBudgets` respeita a vigência                          | CA-11                  | Registro em `2026-10` vale para 10 e 11; registro posterior com `null` em `2026-12` remove a partir de 12; setembro sem limite. |
| TU-11 | `normalizeRows` localiza colunas em qualquer ordem            | CA-15                  | Cabeçalhos `Valor, Categoria, Data` e `Descrição` com acento são reconhecidos. |
| TU-12 | `normalizeRows` com a planilha de 20 linhas do CA-15          | CA-15                  | `valid.length = 17`, `remappedToOthers = 1`, `discarded = [{ reason: 'invalid_date' }]`, `blankRows = 2`. |
| TU-13 | `normalizeRows` sem colunas obrigatórias                      | CA-15                  | Lança `import_missing_columns` listando as colunas ausentes. |
| TU-14 | `normalizeRows` detecta conflitos de mês                      | CA-16                  | Com `existingMonths = ['2026-10']`, `conflicts = ['2026-10']`. |
| TU-15 | Conversão de datas do Excel                                   | CA-15                  | Serial `46324` → `2026-10-29`; `29/10/2026` e `2026-10-29` aceitos; `31/02/2026` → `invalid_date`. |
| TU-16 | `matchCategory` normaliza acento e caixa                      | CA-15                  | `"SAÚDE"`, `"saude"`, `"Saúde "` → `saude`; `"Pets"` → `outros`. |
| TU-17 | Validação de nome de carteira                                 | CA-13                  | `"casa"` conflita com `"Casa"`; vazio ou só espaços → `invalid_name`; 41 caracteres rejeitado. |
| TU-18 | `layoutBubbles` mantém área proporcional e sem sobreposição   | CA-04                  | Razão entre áreas = razão entre valores (±1%); nenhum par de círculos se sobrepõe; tudo dentro do contêiner. |

Estratégia: as funções de domínio são puras e testadas sem mocks. Não há serviços externos a simular; o IndexedDB é substituído por `fake-indexeddb` apenas nos testes de integração.

### Testes de integração (se aplicável)

| ID    | Nome do caso de teste                                               | Critérios de aceitação | Resultado esperado |
|-------|---------------------------------------------------------------------|------------------------|--------------------|
| TI-01 | `expenseRepository` cria, lista por mês, edita e exclui             | CA-01, CA-08           | Lançamento aparece em `listByMonth` do mês certo; edição atualiza `updatedAt`; após `remove`, não aparece mais. |
| TI-02 | Alterar a data muda o mês do lançamento                             | CA-08                  | Ao editar de `2026-10-31` para `2026-11-01`, sai de outubro e aparece em novembro. |
| TI-03 | `walletRepository` garante nome único e exclui em cascata           | CA-12, CA-13           | Criar duplicado lança `wallet_name_taken`; `remove` apaga lançamentos e orçamentos da carteira e mantém os das demais. |
| TI-04 | Isolamento por carteira                                             | CA-12                  | Consultas de "Viagem" não retornam lançamentos nem limites de "Pessoal". |
| TI-05 | `budgetRepository.setLimit` é idempotente e versionado              | CA-09, CA-11           | Salvar duas vezes no mesmo mês sobrescreve; salvar em outro mês cria nova vigência. |
| TI-06 | `replaceMonths` substitui atomicamente                              | CA-16                  | Meses em conflito são substituídos; se uma inserção falhar no meio, a transação é revertida e os dados originais permanecem. |
| TI-07 | Exportar e reimportar preserva os dados (ida e volta)               | CA-14                  | `buildMonthWorkbook` → `parseWorkbook` → `normalizeRows` reproduz os mesmos lançamentos (data, categoria, centavos e descrição) e a soma é igual ao resumo do mês. |
| TI-08 | `ExpenseFormSheet` preserva os dados quando a gravação falha         | CA-02, CA-20           | Com o repositório lançando `storage_unavailable`, a mensagem aparece e os campos permanecem preenchidos. |
| TI-09 | `SummaryPage` atualiza após salvar                                  | CA-04, CA-06           | Após salvar um lançamento, total, percentuais e ranking mudam; clicar na categoria lista só os lançamentos dela. |
| TI-10 | `useSaveExpense` emite aviso ao cruzar faixa                        | CA-10                  | Toast "Mercado em alerta: 86% do limite" e depois "R$ 30,00 acima do limite"; texto exposto em região `aria-live`. |
| TI-11 | `WipeData` apaga tudo e volta ao primeiro uso                        | CA-21                  | Após confirmar, as tabelas ficam vazias, `onboardingDone = false` e uma nova carteira padrão é criada no próximo acesso. |
| TI-12 | Abertura com IndexedDB indisponível                                  | CA-20                  | O app mostra a tela de erro de armazenamento, sem exceção não tratada. |

Dados de teste: fábricas em `src/test/factories.ts` (carteira, lançamento, orçamento) e as planilhas de fixture `tests/fixtures/ca15-20-linhas.xlsx`, `sem-colunas.xlsx` e `corrompido.xlsx`, versionadas no repositório.

### Testes E2E (se aplicável)

| ID     | Nome do caso de teste                                        | Critérios de aceitação | Resultado esperado |
|--------|--------------------------------------------------------------|------------------------|--------------------|
| E2E-01 | Lançamento rápido pelo botão "Lançar"                        | CA-01, CA-03           | De qualquer aba, "Lançar" abre o formulário com foco no valor e `inputmode="decimal"`; salvar 25,90 em Alimentação mostra o item na lista com a data de hoje. |
| E2E-02 | Validação sem perda de dados                                 | CA-02                  | Salvar com valor vazio mostra "Informe o valor" e mantém a categoria e a descrição. |
| E2E-03 | Resumo, percentuais e detalhe por categoria                  | CA-04, CA-05, CA-06    | Com dados semeados em 3 categorias, os percentuais exibidos somam 100%, a soma dos valores bate com o total e o toque numa bolha ou linha abre a lista filtrada. A atualização após salvar leva no máximo 300 ms com 5.000 lançamentos semeados. |
| E2E-04 | Comparação com o mês anterior                                | CA-07                  | Em outubro, aparecem a diferença em R$ e em % e "gastou menos" em relação a setembro. |
| E2E-05 | Editar e excluir lançamento                                  | CA-08                  | Editar o valor reflete na lista e no resumo; excluir pede confirmação e remove o item. |
| E2E-06 | Ciclo de orçamento: ok → alerta → estourado                  | CA-09, CA-10, CA-11    | Limite de R$ 500,00 com R$ 320,00 gastos mostra 64% e "Restam R$ 180,00"; os lançamentos seguintes geram os avisos e "R$ 30,00 acima do limite"; em novembro o limite continua aplicado. |
| E2E-07 | Carteiras: alternar e nome duplicado                         | CA-12, CA-13           | Alternar para "Viagem" isola os dados; criar "Casa" duplicada mostra o erro. |
| E2E-08 | Exportar meses                                               | CA-14                  | O download gera um `.xlsx` por mês; o arquivo é lido no teste e as somas batem com o resumo. |
| E2E-09 | Importar com prévia e conflito                               | CA-15, CA-16           | A fixture de 20 linhas mostra "17 lançamentos, 1 descartada, 1 em Outros"; num mês existente, "Cancelar" mantém os dados e "Substituir" troca. |
| E2E-10 | Funcionamento offline e ausência de tráfego de dados         | CA-17                  | Após a primeira carga, `context.setOffline(true)` + recarregar: lançar, resumo, orçamento, exportar e importar funcionam. Durante toda a suíte, um listener de `request` confirma que só há requisições same-origin a assets estáticos, sem corpo nem query com dados. |
| E2E-11 | Movimento reduzido                                           | CA-18                  | Com `reducedMotion: 'reduce'`, as bolhas renderizam sem transição (sem estilos de animação ativos). |
| E2E-12 | Acessibilidade das telas principais                          | CA-19                  | `axe` sem violações `serious`/`critical` (WCAG 2.1 AA) em Resumo, Lançamentos, Orçamento, formulário e importação, nos temas claro e escuro; cada estado de orçamento tem texto além da cor. |
| E2E-13 | Armazenamento indisponível                                   | CA-20                  | Com o IndexedDB bloqueado por script de inicialização, salvar mostra "Não foi possível salvar no aparelho. Tente de novo." e mantém o formulário. |
| E2E-14 | Apagar dados do aparelho                                     | CA-21                  | Após confirmar, o app volta à tela de boas-vindas e não há lançamentos. |

Os E2E rodam contra o build de produção servido por `vite preview` na porta **5173** (ou outra livre na faixa 51xx), para incluir o service worker. Os dados são semeados por um helper que grava direto no IndexedDB via `page.evaluate`. Durante o QA, os mesmos fluxos podem ser verificados manualmente com a ferramenta de navegador disponível (ex.: Playwright MCP).

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Fundação do projeto** — Vite + React + TS (strict), ESLint, Prettier, Tailwind 4 com os tokens de cor (claro/escuro), Vitest, Playwright e CI (lint, typecheck, testes, cobertura e build). Tudo depende disso.
2. **Domínio** — `money`, `dates`, `categories`, `summary`, `comparison`, `budget` com TU-01 a TU-10. São puros e destravam a UI e os dados.
3. **Persistência** — esquema Dexie, repositórios, `storageGuard` e `settings`, com TI-01 a TI-05 e TI-12.
4. **Shell e lançamentos** — `AppShell`, roteamento, `WalletProvider`, `ExpenseFormSheet`, `CategoryPicker`, `ExpenseList`, edição e exclusão (TI-08, E2E-01, 02 e 05). Primeiro fluxo de ponta a ponta.
5. **Resumo** — `MonthSwitcher`, `MonthTotalCard`, `CategoryRanking` e, em seguida, `layoutBubbles` + `CategoryBubbles` com Motion e movimento reduzido (TU-18, TI-09, E2E-03, 04 e 11).
6. **Orçamento** — `BudgetPage`, `BudgetRow`, `BudgetOverview` e aviso de faixa no `useSaveExpense` (TI-10, E2E-06).
7. **Carteiras** — `WalletSwitcher` e `WalletManager` (TI-03, TI-04, E2E-07).
8. **Importar/exportar** — `importRules` (TU-11 a TU-16), `xlsxAdapter` com carregamento dinâmico, `ExportPanel`, `ImportWizard` e modelo (TI-06, TI-07, E2E-08, 09).
9. **PWA e privacidade** — `vite-plugin-pwa`, ícones e manifest, `requestPersistence`, onboarding com exemplo, `AboutPrivacy` e `WipeData` (TI-11, E2E-10, 13 e 14).
10. **Polimento e qualidade** — microanimações de confirmação, estados vazios, auditoria de acessibilidade (E2E-12), orçamento de desempenho (Lighthouse) e configuração de deploy (rewrite, cabeçalhos e CSP).

### Dependências técnicas

- Node.js 22 LTS e npm.
- Versões de referência (verificadas no npm em 2026-10-29): `react@19.3`, `vite@8.3`, `vite-plugin-pwa@2.0`, `dexie@4.4`, `dexie-react-hooks@4.4`, `d3-hierarchy@3.1`, `motion@14.8`, `read-excel-file@9.3`, `write-excel-file@4.1`, `zod@4.6`, `react-router@8.5`, `lucide-react@1.64`, `tailwindcss@4.3`, `vitest@5.0`, `@testing-library/react@16.3`, `fake-indexeddb@6.2`, `@playwright/test@1.64`, `@axe-core/playwright@4.14`. Fixar versões exatas no `package.json` e manter o lockfile versionado.
- Conta no Netlify ou Vercel com HTTPS (exigido para service worker e instalação).
- Nenhum serviço externo em tempo de execução.

## Monitoramento e observabilidade

Não há backend nem telemetria no MVP (restrição de privacidade do PRD). A observabilidade é local e voltada ao desenvolvimento:

- **Logger interno (`src/lib/log.ts`)** com níveis `debug` (só em desenvolvimento), `warn` e `error`, escrevendo no console. Nunca registra valores, descrições ou nomes de carteira; registra apenas códigos de `AppError`, nome da operação e contagens.
- **Eventos registrados:** falha ao abrir o banco (`error`), falha de gravação (`error`, com o código), cota excedida (`error`), resultado de `storage.persist()` (`debug`), importação concluída (`debug`, com contagens de válidas e descartadas), nova versão do service worker disponível (`debug`) e exceções capturadas pelo `ErrorBoundary` (`error`).
- **Desempenho:** em desenvolvimento, `performance.mark/measure` em torno de "salvar → resumo renderizado", para validar a meta de 300 ms; no CI, Lighthouse CI sobre o build com limites de LCP ≤ 2,5 s (perfil mobile) e categoria PWA aprovada.
- **Saúde do armazenamento:** `navigator.storage.estimate()` exibido na tela "Privacidade" (espaço usado), útil para diagnóstico pelo usuário.
- As métricas de produto do PRD (engajamento e retenção) ficam para uma telemetria anônima e opcional futura, fora do escopo desta spec; até lá, são validadas em teste de usabilidade.

## Considerações técnicas

### Principais decisões

- **SPA estática + PWA, sem backend:** atende ao requisito "dados só no aparelho" e offline com o menor custo operacional. *Descartado:* Next.js (SSR não agrega valor a um app 100% local) e backend com sincronização (fora do escopo).
- **IndexedDB via Dexie, em vez de `localStorage`:** consultas indexadas por carteira e mês, transações atômicas (necessárias para importar e substituir), maior cota e consultas reativas com `useLiveQuery`, que dispensam uma camada de estado global. *Descartado:* `localStorage` (síncrono, ~5 MB, sem transações) e `idb` puro (exigiria construir reatividade e migrações à mão).
- **Centavos inteiros e datas como string local:** evitam erros de ponto flutuante na soma e problemas de fuso (`new Date('2026-10-01')` em UTC vira 30/09 no Brasil).
- **Agregação em memória:** o resumo é calculado a partir dos lançamentos do mês (centenas, no máximo poucos milhares), o que é trivial em tempo e evita totais desnormalizados que poderiam ficar inconsistentes.
- **Percentuais pelo maior resto:** garantem a soma exata de 100,0% exigida pelo CA-05.
- **Orçamento com vigência (`effectiveFrom`):** atende ao RF20 e preserva o histórico de meses anteriores quando o limite muda. *Descartado:* um limite único por categoria (alterar em novembro reescreveria outubro) e a cópia mês a mês (exigiria um job ao virar o mês).
- **Bolhas com `d3-hierarchy` + SVG + Motion:** `pack` dá área proporcional sem sobreposição e o layout é determinístico (testável, TU-18). Motion anima posição e raio com `layout`/springs e tem suporte nativo a `useReducedMotion`. *Descartado:* simulação de força (`d3-force`), não determinística e mais pesada; bibliotecas de gráfico prontas (Recharts/ECharts), pouco flexíveis para o visual lúdico. Para poucas categorias (≤ 2), o layout continua válido; o ranking em lista é sempre exibido abaixo.
- **`read-excel-file` + `write-excel-file`, carregadas sob demanda:** leves, focadas no navegador e mantidas. *Descartado:* `xlsx` (SheetJS) do npm, parado na 0.18.5 com vulnerabilidades conhecidas (a versão atual é distribuída fora do registro npm); `exceljs`, cerca de 20 MB descompactado e mais pesado no bundle.
- **zod** para validar o formulário e as linhas importadas com as mesmas regras do domínio.
- **Tailwind 4 com tokens CSS:** as cores das categorias e os temas claro/escuro ficam em variáveis CSS, com contraste validado; os ícones vêm do `lucide-react` (tree-shakable).
- **`registerType: 'prompt'` no service worker:** evita recarregar o app no meio de um lançamento; o usuário escolhe quando atualizar.
- **Carteira de exemplo como carteira real (`isSample: true`):** reaproveita todo o fluxo sem modo especial; o rótulo "Exemplo · dados fictícios" fica visível e o usuário pode excluí-la como qualquer carteira.

### Riscos conhecidos

- **Perda de dados por limpeza do navegador ou despejo de armazenamento (sobretudo Safari/iOS, que pode apagar dados de sites não usados em 7 dias quando não instalados):** mitigar com `storage.persist()`, incentivo à instalação na tela inicial, aviso no onboarding e lembrete de exportação após 30 dias (`lastExportAt`).
- **Download de arquivos no PWA instalado no iOS:** `<a download>` tem comportamento inconsistente; mitigar com `navigator.share({ files })` quando disponível e validar em aparelho real.
- **Variedade de planilhas importadas** (datas como texto, serial ou `Date`; valores com "R$", vírgula ou ponto): coberto por TU-11 a TU-16; risco residual em formatos exóticos, que viram linhas descartadas com motivo visível na prévia.
- **Desempenho das animações em aparelhos modestos:** limitar a 12 bolhas (uma por categoria), animar apenas `transform`/`r` e testar em perfil de CPU com redução de 4× no DevTools.
- **Fusos e virada de dia:** `today()` usa a data local; testes com `TZ=America/Sao_Paulo` e `TZ=UTC` no CI.
- **Migrações de esquema do Dexie:** qualquer mudança futura exige uma nova `version()` com `upgrade`; manter testes de migração a partir da v1.
- **Contraste das 12 cores de categoria nos dois temas:** validar a paleta com ferramenta de contraste antes da implementação da UI (CA-19).

### Conformidade com o AGENTS.md e as rules

Verificado em 2026-10-29: o repositório não contém `CLAUDE.md`, `AGENTS.md` nem a pasta `.agents/rules/` (projeto greenfield com apenas as skills do fluxo em `.claude/skills/`). Não há restrições herdadas. Esta spec estabelece as convenções iniciais, que devem ser registradas em um `CLAUDE.md` na tarefa de fundação:

- Comandos: `npm run dev` (porta 5173), `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run test:e2e`.
- Meta de cobertura: 80% de linhas e branches em `src/domain/` e `src/data/`.
- TypeScript `strict`; dinheiro sempre em centavos; datas como `YYYY-MM-DD`; textos de UI em pt-BR.
- Portas: frontend na faixa 51xx (padrão adotado pela skill `executar-review`).

### Conformidade com skills

Não existe `.agents/skills/` no projeto. As skills do fluxo em `.claude/skills/` aplicáveis às próximas etapas são:

- `criar-tasks` — decompõe esta spec seguindo a ordem de construção acima.
- `executar-task` — implementa as tarefas, respeitando os IDs de teste definidos aqui.
- `executar-review` — usa os comandos e a meta de cobertura que serão registrados no `CLAUDE.md`.
- `executar-qa` — valida os CA-01 a CA-21 com os casos TU, TI e E2E e com a ferramenta de navegador disponível.

Sem desvios a registrar.

### Arquivos relevantes e dependentes

Existentes:

- `tasks/prd-controle-gastos-diarios/prd.md` — requisitos de origem.

A criar (estrutura prevista):

```
CLAUDE.md
package.json, vite.config.ts, tsconfig.json, eslint.config.js, playwright.config.ts
netlify.toml (ou vercel.json)          # rewrite SPA, cabeçalhos, CSP
public/                                 # ícones PWA, favicon
src/main.tsx, src/App.tsx, src/styles/tokens.css
src/domain/{money,dates,categories,summary,comparison,budget,importRules,bubbleLayout}.ts
src/data/{db,walletRepository,expenseRepository,budgetRepository,settingsRepository,storageGuard,xlsxAdapter,sampleData}.ts
src/hooks/{useActiveWallet,useMonthSummary,useMonthExpenses,useBudgets,useSaveExpense}.ts
src/features/{app,summary,expenses,budget,wallets,transfer,onboarding,settings}/
src/ui/                                 # componentes base
src/lib/log.ts, src/lib/errors.ts       # logger e AppError
src/test/factories.ts
tests/e2e/*.spec.ts, tests/fixtures/*.xlsx
```
