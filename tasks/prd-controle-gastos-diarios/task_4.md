# Tarefa 4.0: Shell e lançamentos

## Visão geral

Entregar o primeiro fluxo de ponta a ponta: o `AppShell` com navegação inferior (Resumo, Lançamentos, Orçamento, Mais), roteamento, provedores de tema e de carteira ativa, `ErrorBoundary`, `Toaster` com `aria-live`, o botão "Lançar" sempre visível, o formulário de criar/editar com `CategoryPicker`, a lista de lançamentos do mês com filtro por categoria e a exclusão com confirmação.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa` (validação dos fluxos com a ferramenta de navegador).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0: textos em pt-BR, moeda `R$ 1.234,56`, datas `dd/mm/aaaa` na UI. Alvos de toque de no mínimo 44 × 44 px e rótulos acessíveis em botões só com ícone (PRD, "Acessibilidade"). Sem desvios.
</rules>

<requirements>
- RF1–RF2: criar o lançamento na carteira ativa, com a data de hoje como padrão.
- RF3: "Lançar" acessível em um toque a partir de qualquer tela principal; o formulário abre com foco no valor e `inputmode="decimal"` (CA-03).
- RF4: mensagens de validação específicas sem apagar o que foi digitado.
- RF5: retorno visual ao salvar (a microanimação final é refinada na tarefa 10.0).
- RF6: lista do mês da carteira ativa, mais recente primeiro, com valor, categoria, data e descrição; filtro por categoria.
- RF7: editar e excluir; a exclusão pede confirmação e avisa que não pode ser desfeita.
- RF9–RF10: categoria sempre com nome e/ou ícone, nunca só cor.
- RF39: com falha de armazenamento, mostrar "Não foi possível salvar no aparelho. Tente de novo." e manter o formulário.
- Tela de erro de armazenamento na abertura, sem exceção não tratada (TI-12).
</requirements>

## Subtarefas

- [x] 4.1 Componentes base em `src/ui/` (`Button`, `Sheet`, `Dialog`, `MoneyInput`, `EmptyState`).
- [x] 4.2 `AppShell`, roteador, `ErrorBoundary`, `Toaster`, provedor de tema e `WalletProvider`/`useActiveWallet`.
- [x] 4.3 `LaunchButton` flutuante e `ExpenseFormSheet` (criar/editar) com `CategoryPicker` em grade de ícones.
- [x] 4.4 Hook `useSaveExpense` (validação zod, gravação, tratamento de `AppError`). O aviso de orçamento é adicionado na tarefa 6.0.
- [x] 4.5 `useMonthExpenses` e `ExpenseList` com filtro por categoria, edição e `ConfirmDialog` para exclusão.
- [x] 4.6 Tela de erro de armazenamento na abertura (conclui o TI-12).
- [x] 4.7 Testes TI-08, E2E-01, E2E-02 e E2E-05, mais o helper de semeadura do IndexedDB via `page.evaluate`.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (UI: `app/`, `features/expenses/`, `ui/`; Hooks de aplicação), "Fluxo de dados" (passo 1) e "Pontos de integração" (IndexedDB). Navegação e fluxo "Lançar" em `prd.md`, "Experiência do usuário".

## Critérios de aceitação relacionados

- CA-01
- CA-02
- CA-03
- CA-08
- CA-20

## Testes da tarefa

### Testes de integração (se aplicável)

- [x] TI-08 — `ExpenseFormSheet` preserva os dados quando a gravação falha

### Testes E2E (se aplicável)

- [x] E2E-01 — Lançamento rápido pelo botão "Lançar"
- [x] E2E-02 — Validação sem perda de dados
- [x] E2E-05 — Editar e excluir lançamento

## Arquivos relevantes

- `src/App.tsx`, `src/main.tsx`
- `src/features/app/` (`AppShell`, `LaunchButton`, roteador, `ErrorBoundary`, `Toaster`, provedores)
- `src/features/expenses/` (`ExpenseFormSheet`, `CategoryPicker`, `ExpenseList`, `ConfirmDialog`)
- `src/ui/`
- `src/hooks/useActiveWallet.ts`, `src/hooks/useMonthExpenses.ts`, `src/hooks/useSaveExpense.ts`
- `tests/e2e/lancamentos.spec.ts`, `tests/e2e/helpers/seed.ts`
