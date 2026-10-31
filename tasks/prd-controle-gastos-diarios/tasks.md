# Resumo das tarefas de implementação de Controle de Gastos Diários

Fontes: [`prd.md`](./prd.md) e [`techspec.md`](./techspec.md). A ordem segue a seção "Sequenciamento do desenvolvimento" da TechSpec.

## Tarefas

- [x] 1.0 Fundação do projeto (Vite, React, TS strict, Tailwind 4, Vitest, Playwright, CI e `CLAUDE.md`)
- [x] 2.0 Domínio: dinheiro, datas, categorias, resumo, comparação, orçamento e schema do lançamento — depende de 1.0
- [x] 3.0 Persistência: Dexie, repositórios, `storageGuard`, `settings`, `AppError` e logger — depende de 2.0
- [x] 4.0 Shell e lançamentos: navegação, botão "Lançar", formulário, lista, edição e exclusão — depende de 3.0
- [x] 5.0 Resumo do mês: seletor de mês, total com comparação, ranking e bolhas animadas — depende de 4.0
- [x] 6.0 Orçamento por categoria: barras de progresso, três estados e avisos de faixa — depende de 5.0
- [x] 7.0 Carteiras: alternar, criar, renomear e excluir em cascata — depende de 4.0
- [x] 8.0 Importar e exportar `.xlsx`: regras de importação, adaptador, prévia, conflito e modelo — depende de 3.0 e 4.0
- [x] 9.0 PWA e privacidade: service worker, persistência, boas-vindas, Sobre/Privacidade e apagar dados — depende de 4.0, 7.0 e 8.0
- [x] 10.0 Polimento e qualidade: microanimações, estados vazios, acessibilidade, desempenho e deploy — depende de 1.0 a 9.0

## Mapa de cobertura

| Tarefa | Critérios de aceitação | Casos de teste |
| ------ | ---------------------- | -------------- |
| 1.0 | — (infraestrutura) | — |
| 2.0 | CA-01, CA-02, CA-04, CA-05, CA-07, CA-09, CA-10, CA-11 | TU-01 a TU-10 |
| 3.0 | CA-01, CA-08, CA-09, CA-11, CA-12, CA-20 | TI-01, TI-02, TI-04, TI-05, TI-12 |
| 4.0 | CA-01, CA-02, CA-03, CA-08, CA-20 | TI-08, E2E-01, E2E-02, E2E-05 |
| 5.0 | CA-04, CA-05, CA-06, CA-07, CA-18 | TU-18, TI-09, E2E-03, E2E-04, E2E-11 |
| 6.0 | CA-09, CA-10, CA-11 | TI-10, E2E-06 |
| 7.0 | CA-12, CA-13 | TU-17, TI-03, E2E-07 |
| 8.0 | CA-14, CA-15, CA-16 | TU-11 a TU-16, TI-06, TI-07, E2E-08, E2E-09 |
| 9.0 | CA-17, CA-20, CA-21 | TI-11, E2E-10, E2E-13, E2E-14 |
| 10.0 | CA-19 | E2E-12 |
