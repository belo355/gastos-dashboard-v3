# Tarefa 6.0: Orçamento por categoria

## Visão geral

Implementar o controle ativo do orçamento: a tela de Orçamento para definir, alterar e remover limites mensais por categoria, a barra de progresso com três estados (dentro do limite, em alerta, estourado), o `BudgetOverview` no resumo e o aviso no app quando um lançamento faz a categoria mudar de faixa.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0. Cada estado da barra tem texto além da cor e linguagem positiva ("Restam R$ 180,00"). Os avisos são anunciados em região `aria-live`. Sem desvios.
</rules>

<requirements>
- RF19: definir, alterar e remover limite mensal por categoria e carteira.
- RF20: o limite vale para o mês corrente e os seguintes até ser alterado.
- RF21: barra com valor gasto, limite e restante ou excedente ("R$ 320,00 de R$ 500,00", "Restam R$ 180,00", "R$ 30,00 acima do limite").
- RF22: estados `ok` (< 80%), `warning` (80% a 100%) e `over` (> 100%), com texto do estado; a barra visual satura em 100%.
- RF23: aviso no app ao entrar em alerta ou estourar (ex.: "Mercado em alerta: 86% do limite").
- RF24: total orçado do mês, total gasto nas categorias orçadas e saldo restante.
- Categoria orçada sem gasto mostra a barra em 0%.
</requirements>

## Subtarefas

- [x] 6.1 Hook `useBudgets(walletId, month)` com `resolveBudgets` e `budgetStatus`.
- [x] 6.2 Componente base `ProgressBar` e `BudgetRow` com os três estados e textos.
- [x] 6.3 `BudgetEditor` e `BudgetPage` (definir, alterar e remover limite a partir do mês selecionado).
- [x] 6.4 `BudgetOverview` no resumo (total orçado, gasto e saldo).
- [x] 6.5 Estender `useSaveExpense`: ler o estado antes, gravar, recalcular e publicar o toast quando `detectThresholdCrossing` indicar `warning` ou `over`.
- [x] 6.6 Testes TI-10 e E2E-06.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (`features/budget/`, `BudgetOverview`, `useBudgets`, `useSaveExpense`), "Fluxo de dados" (passo 1), modelos `BudgetRecord` e `BudgetProgress` e "Principais decisões" (orçamento com vigência `effectiveFrom`).

## Critérios de aceitação relacionados

- CA-09
- CA-10
- CA-11

## Testes da tarefa

### Testes de integração (se aplicável)

- [x] TI-10 — `useSaveExpense` emite aviso ao cruzar faixa

### Testes E2E (se aplicável)

- [x] E2E-06 — Ciclo de orçamento: ok → alerta → estourado

## Arquivos relevantes

- `src/features/budget/` (`BudgetPage`, `BudgetRow`, `BudgetEditor`)
- `src/features/summary/BudgetOverview.tsx`
- `src/ui/ProgressBar.tsx`
- `src/hooks/useBudgets.ts`, `src/hooks/useSaveExpense.ts`
- `tests/e2e/orcamento.spec.ts`
