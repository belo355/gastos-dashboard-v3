# Tarefa 3.0: Persistência — Dexie, repositórios, storageGuard e settings

## Visão geral

Implementar a camada de dados local: banco Dexie `GastosDB` com esquema versionado, repositórios de carteiras, lançamentos, orçamentos e preferências, o `storageGuard` (IndexedDB indisponível, cota, `AppError`), o envelope `AppError` e o logger interno. Inclui as fábricas de teste.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task` e `executar-review`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0: cobertura de 80% em `src/data/`, dinheiro em centavos e datas `YYYY-MM-DD`. O logger nunca registra valores, descrições ou nomes de carteira. Sem desvios.
</rules>

<requirements>
- RF2: o lançamento é salvo na carteira ativa.
- RF6–RF7: listar o mês por carteira (mais recente primeiro, desempate por `createdAt`), editar e excluir.
- RF19–RF20: definir, alterar e remover limite por categoria e carteira, com vigência a partir do mês.
- RF25: criação da carteira padrão no primeiro uso (via `settings`).
- RF27: consultas isoladas por carteira.
- RF36: dados somente no IndexedDB do aparelho.
- RF39: falhas de armazenamento viram `AppError` com mensagem clara (`storage_unavailable`, `storage_quota`).
- Campos opcionais ausentes armazenados como `null`; gravações em transação.
</requirements>

## Subtarefas

- [x] 3.1 `src/lib/errors.ts` (`AppError` e códigos) e `src/lib/log.ts` (níveis `debug`, `warn`, `error`).
- [x] 3.2 `db.ts`: esquema Dexie v1 com as tabelas `wallets`, `expenses`, `budgets`, `settings` e seus índices.
- [x] 3.3 `expenseRepository` (`listByMonth`, `monthsWithData`, `create`, `update`, `remove`), derivando `month` de `date`. `replaceMonths` fica na tarefa 8.0.
- [x] 3.4 `budgetRepository` (`listForWallet`, `setLimit` idempotente por `id` composto).
- [x] 3.5 `walletRepository` básico (`list`, `create`) e `settingsRepository` (carteira ativa, `onboardingDone`, carteira padrão no primeiro uso). Nome único, `rename` e `remove` em cascata ficam na tarefa 7.0.
- [x] 3.6 `storageGuard`: detecção de IndexedDB indisponível e tradução das exceções do Dexie para `AppError`.
- [x] 3.7 Fábricas em `src/test/factories.ts`.
- [x] 3.8 Testes TI-01, TI-02, TI-04, TI-05 e TI-12 com `fake-indexeddb`.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (Dados), "Principais interfaces" (`WalletRepository`, `ExpenseRepository`, `BudgetRepository`), "Modelos de dados" (`Wallet`, `Expense`, `BudgetRecord`, `Settings`, `AppError`), "Pontos de integração" (IndexedDB) e "Monitoramento e observabilidade" (logger).

## Critérios de aceitação relacionados

- CA-01
- CA-08
- CA-09
- CA-11
- CA-12
- CA-20

## Testes da tarefa

### Testes de integração (se aplicável)

- [x] TI-01 — `expenseRepository` cria, lista por mês, edita e exclui
- [x] TI-02 — Alterar a data muda o mês do lançamento
- [x] TI-04 — Isolamento por carteira
- [x] TI-05 — `budgetRepository.setLimit` é idempotente e versionado
- [x] TI-12 — Abertura com IndexedDB indisponível (parte de dados: o erro é traduzido para `AppError`; a tela de erro é concluída na tarefa 4.0)

## Arquivos relevantes

- `src/data/db.ts`
- `src/data/repositories.ts`
- `src/data/walletRepository.ts`
- `src/data/expenseRepository.ts`
- `src/data/budgetRepository.ts`
- `src/data/settingsRepository.ts`
- `src/data/storageGuard.ts`
- `src/lib/errors.ts`, `src/lib/log.ts`
- `src/test/factories.ts`
- `src/data/*.test.ts`
