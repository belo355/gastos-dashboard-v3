# Tarefa 5.0: Resumo do mês

## Visão geral

Construir a tela principal: seletor de mês, cartão com o total do mês e a comparação com o mês anterior, ranking acessível por categoria (valor, % e quantidade) e a visualização lúdica em bolhas proporcionais (`d3-hierarchy` `pack` + Motion), que respeita o movimento reduzido. Tocar numa categoria abre os lançamentos dela no mês.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0. O ranking em lista é o equivalente acessível das bolhas e fica sempre visível; a cor nunca é o único identificador. Sem desvios.
</rules>

<requirements>
- RF11: total do mês da carteira ativa.
- RF12–RF13: por categoria, valor, percentual e quantidade, em ranking decrescente; percentuais somam 100% (CA-05).
- RF14: bolhas com área proporcional ao valor, cores das categorias e animação de entrada/atualização.
- RF15: tocar numa bolha ou linha do ranking lista só os lançamentos daquela categoria no mês.
- RF16: navegar para meses anteriores e seguintes ("Outubro 2026").
- RF17: diferença em R$ e % sobre o mês anterior, com "gastou mais"/"gastou menos" e "Primeiro mês com gastos" quando não houver anterior.
- RF18: animações desativadas com "reduzir movimento".
- Resumo atualizado em até 300 ms após salvar, com até 5.000 lançamentos (CA-04).
- Estado vazio do mês com convite para lançar.
</requirements>

## Subtarefas

- [x] 5.1 Hook `useMonthSummary(walletId, month)` com `useLiveQuery`, `summarizeMonth` e `compareMonths` memoizados.
- [x] 5.2 `MonthSwitcher` e `MonthTotalCard` (total + comparação).
- [x] 5.3 `CategoryRanking` (lista acessível) com navegação para os lançamentos filtrados.
- [x] 5.4 `bubbleLayout.layoutBubbles` em `src/domain/` e teste TU-18.
- [x] 5.5 `CategoryBubbles` (SVG + Motion), animando apenas `transform`/`r`, e `useReducedMotionPref`.
- [x] 5.6 `SummaryPage` com estado vazio.
- [x] 5.7 Medição `performance.mark/measure` de "salvar → resumo renderizado" em desenvolvimento.
- [x] 5.8 Testes TI-09, E2E-03 (inclui a semeadura de 5.000 lançamentos), E2E-04 e E2E-11.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (`features/summary/`, `bubbleLayout`), "Fluxo de dados" (passo 2), modelos `MonthSummary` e `MonthComparison`, "Principais decisões" (bolhas com `d3-hierarchy` + SVG + Motion; agregação em memória) e "Riscos conhecidos" (desempenho das animações).

## Critérios de aceitação relacionados

- CA-04
- CA-05
- CA-06
- CA-07
- CA-18

## Testes da tarefa

### Testes de unidade (se aplicável)

- [x] TU-18 — `layoutBubbles` mantém área proporcional e sem sobreposição

### Testes de integração (se aplicável)

- [x] TI-09 — `SummaryPage` atualiza após salvar

### Testes E2E (se aplicável)

- [x] E2E-03 — Resumo, percentuais e detalhe por categoria
- [x] E2E-04 — Comparação com o mês anterior
- [x] E2E-11 — Movimento reduzido

## Arquivos relevantes

- `src/domain/bubbleLayout.ts`, `src/domain/bubbleLayout.test.ts`
- `src/features/summary/` (`SummaryPage`, `MonthSwitcher`, `MonthTotalCard`, `CategoryBubbles`, `CategoryRanking`)
- `src/hooks/useMonthSummary.ts`, `src/hooks/useReducedMotionPref.ts`
- `tests/e2e/resumo.spec.ts`
