# Tarefa 1.0: Fundação do projeto

## Visão geral

Criar a base do projeto greenfield: SPA em React 19 + TypeScript (strict) + Vite, com ESLint, Prettier, Tailwind 4 e tokens de cor (claro/escuro), Vitest com cobertura, Playwright com axe e CI. Registrar no `CLAUDE.md` os comandos e as convenções definidos na TechSpec. Todas as demais tarefas dependem desta.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task` (implementação) e `executar-review` (usa os comandos e a meta de cobertura registrados aqui no `CLAUDE.md`).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Verificado em 2026-10-30: não há `AGENTS.md` nem `.agents/rules/`, e o `CLAUDE.md` está vazio. Esta tarefa preenche o `CLAUDE.md` com as convenções da TechSpec ("Conformidade com o AGENTS.md e as rules"). Sem desvios.
</rules>

<requirements>
- Node.js 22 LTS e npm; versões exatas fixadas no `package.json` (TechSpec, "Dependências técnicas") e lockfile versionado.
- TypeScript `strict`.
- Scripts: `dev` (porta 5173), `build`, `preview`, `lint`, `typecheck`, `test`, `test:coverage`, `test:e2e`.
- Cobertura mínima de 80% de linhas e branches em `src/domain/` e `src/data/`; o CI falha abaixo disso.
- Tokens CSS de tema claro/escuro (seguindo a preferência do sistema) e das 12 cores de categoria, com contraste validado (CA-19, risco "Contraste das 12 cores").
- Playwright com Chromium e WebKit, viewports mobile 390×844 e desktop, contra o `vite preview` na faixa 51xx.
- CI com testes em `TZ=America/Sao_Paulo` e `TZ=UTC`.
</requirements>

## Subtarefas

- [x] 1.1 Criar o projeto Vite + React + TS strict com a estrutura de pastas prevista (`src/domain`, `src/data`, `src/hooks`, `src/features`, `src/ui`, `src/lib`, `src/test`, `tests/e2e`, `tests/fixtures`).
- [x] 1.2 Configurar ESLint e Prettier.
- [x] 1.3 Configurar Tailwind 4 e `src/styles/tokens.css` com os temas claro/escuro e as cores de categoria.
- [x] 1.4 Configurar Vitest (`jsdom`, `fake-indexeddb`, `@testing-library/react`) e `@vitest/coverage-v8` com o limite de 80% em `src/domain/` e `src/data/`.
- [x] 1.5 Configurar Playwright e `@axe-core/playwright` (`playwright.config.ts`, `webServer` com `vite preview`).
- [x] 1.6 Configurar o CI: lint, typecheck, testes nos dois fusos, cobertura, build e E2E.
- [x] 1.7 Preencher o `CLAUDE.md` com comandos, portas, meta de cobertura e convenções (centavos, `YYYY-MM-DD`, textos em pt-BR).
- [x] 1.8 Criar um teste de fumaça (unidade e E2E) que prove que a cadeia de testes funciona.

## Detalhes de implementação

Ver em `techspec.md`: "Resumo", "Abordagem de testes" (ferramentas e meta de cobertura), "Dependências técnicas", "Conformidade com o AGENTS.md e as rules" e "Arquivos relevantes e dependentes".

## Critérios de aceitação relacionados

Tarefa de infraestrutura, sem critério de aceitação direto. Habilita a validação de todos os CA-01 a CA-21.

## Testes da tarefa

Não há casos de teste da TechSpec mapeados. A tarefa entrega a infraestrutura onde rodam os TU, TI e E2E, validada por um teste de fumaça.

### Testes de unidade (se aplicável)

- [x] Teste de fumaça do Vitest

### Testes E2E (se aplicável)

- [x] Teste de fumaça do Playwright (o app abre no `vite preview`)

## Arquivos relevantes

- `CLAUDE.md`
- `package.json`, `package-lock.json`
- `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`
- `playwright.config.ts`
- `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`
- Configuração de CI (ex.: `.github/workflows/ci.yml`)
