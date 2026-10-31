# Tarefa 2.0: Domínio — dinheiro, datas, categorias, resumo, comparação e orçamento

## Visão geral

Implementar as funções puras de domínio, sem React nem IndexedDB: conversão e formatação de dinheiro em centavos, utilitários de datas e meses, catálogo das 12 categorias, resumo do mês com percentuais pelo maior resto, comparação com o mês anterior, cálculo e vigência do orçamento e o schema zod do `ExpenseInput`. Destrava a persistência e a UI.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task` e `executar-review`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir as convenções registradas no `CLAUDE.md` na tarefa 1.0: dinheiro sempre em centavos inteiros, datas `YYYY-MM-DD` sem fuso, textos em pt-BR e cobertura de 80% em `src/domain/`. Sem desvios.
</rules>

<requirements>
- RF1: valor > 0 em R$ com duas casas, categoria obrigatória, data obrigatória (padrão hoje), descrição opcional até 80 caracteres, com as mensagens "Informe o valor", "Data inválida" e "Escolha uma categoria" (RF4).
- RF8–RF9: catálogo fixo de 12 categorias com id, nome, ícone e token de cor.
- RF11–RF13: total do mês, valor, percentual e quantidade por categoria, em ranking decrescente (desempate por nome).
- RF17: variação do total sobre o mês anterior (valor, % e direção).
- RF20–RF22: limite vigente por mês (`effectiveFrom`) e faixas `ok` (< 80%), `warning` (80% a 100%) e `over` (> 100%), com restante e excedente.
- RF23: detecção de mudança de faixa para disparar o aviso.
- Formatação BRL `R$ 1.234,56` e rótulo de mês "Outubro 2026".
</requirements>

## Subtarefas

- [x] 2.1 `money`: `parseMoney` e `formatMoney`.
- [x] 2.2 `dates`: `today()`, `monthKey`, `addMonths`, `formatMonthLabel`, validação `YYYY-MM-DD`.
- [x] 2.3 `categories`: catálogo das 12 categorias e `matchCategory` (o teste TU-16 fica na tarefa 8.0).
- [x] 2.4 Schema zod do `ExpenseInput` com as mensagens da TechSpec.
- [x] 2.5 `summary`: `summarizeMonth` com percentuais pelo método do maior resto.
- [x] 2.6 `comparison`: `compareMonths`.
- [x] 2.7 `budget`: `budgetStatus`, `detectThresholdCrossing` e `resolveBudgets`.
- [x] 2.8 Testes TU-01 a TU-10, incluindo o teste de propriedade do TU-05.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (Domínio), "Principais interfaces" (funções puras) e os modelos `ExpenseInput`, `Category`, `BudgetRecord`, `MonthSummary`, `MonthComparison` e `BudgetProgress` em "Modelos de dados". Decisões em "Principais decisões" (centavos, maior resto, vigência).

## Critérios de aceitação relacionados

- CA-01
- CA-02
- CA-04
- CA-05
- CA-07
- CA-09
- CA-10
- CA-11

## Testes da tarefa

### Testes de unidade (se aplicável)

- [x] TU-01 — `parseMoney` aceita formatos pt-BR
- [x] TU-02 — `formatMoney` formata em BRL
- [x] TU-03 — Schema de `ExpenseInput` valida campos
- [x] TU-04 — `summarizeMonth` agrega, ordena e conta
- [x] TU-05 — Percentuais pelo maior resto somam 100,0
- [x] TU-06 — `summarizeMonth` com lista vazia
- [x] TU-07 — `compareMonths` cobre mais, menos, igual e sem anterior
- [x] TU-08 — `budgetStatus` aplica as faixas
- [x] TU-09 — `detectThresholdCrossing` só dispara ao mudar de faixa
- [x] TU-10 — `resolveBudgets` respeita a vigência

## Arquivos relevantes

- `src/domain/money.ts`
- `src/domain/dates.ts`
- `src/domain/categories.ts`
- `src/domain/summary.ts`
- `src/domain/comparison.ts`
- `src/domain/budget.ts`
- `src/domain/expenseSchema.ts` (schema zod do `ExpenseInput`)
- `src/domain/*.test.ts`
