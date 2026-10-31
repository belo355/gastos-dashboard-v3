# Tarefa 7.0: Carteiras

## Visão geral

Permitir separar contextos de gasto: alternar a carteira ativa em um toque e criar, renomear e excluir carteiras, com nome obrigatório e único (sem diferenciar maiúsculas e acentos). A exclusão apaga em cascata os lançamentos e orçamentos da carteira, após confirmação explícita.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0. Sem desvios.

Nota: o TU-17 não aparece na "Ordem de construção" da TechSpec; foi atribuído a esta tarefa, conforme aprovado na proposta.
</rules>

<requirements>
- RF25: carteira padrão criada no primeiro uso (já entregue na tarefa 3.0; mantida aqui).
- RF26: criar, renomear e excluir; nome de 1 a 40 caracteres, aparado, obrigatório ("Informe o nome da carteira") e único ("Já existe uma carteira com esse nome").
- RF27: alternar a carteira ativa em um toque; lançamentos, resumo e orçamentos refletem a carteira ativa.
- RF28: excluir apaga lançamentos e orçamentos da carteira, após confirmação explícita, e mantém os das demais.
</requirements>

## Subtarefas

- [x] 7.1 Validação de nome de carteira (normalização sem acento e sem caixa) e teste TU-17.
- [x] 7.2 Completar o `walletRepository`: nome único em `create`/`rename` e `remove` em cascata numa transação.
- [x] 7.3 `WalletSwitcher` no resumo e na navegação, atualizando `Settings.activeWalletId`.
- [x] 7.4 `WalletManager` no menu "Mais" (criar, renomear, excluir com confirmação), com tratamento da exclusão da carteira ativa.
- [x] 7.5 Testes TI-03 e E2E-07.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (`features/wallets/`, `walletRepository`), "Principais interfaces" (`WalletRepository`), modelos `Wallet`, `Settings` e `AppError` (`wallet_name_taken`, `invalid_name`).

## Critérios de aceitação relacionados

- CA-12
- CA-13

## Testes da tarefa

### Testes de unidade (se aplicável)

- [x] TU-17 — Validação de nome de carteira

### Testes de integração (se aplicável)

- [x] TI-03 — `walletRepository` garante nome único e exclui em cascata

### Testes E2E (se aplicável)

- [x] E2E-07 — Carteiras: alternar e nome duplicado

## Arquivos relevantes

- `src/domain/walletName.ts`, `src/domain/walletName.test.ts`
- `src/data/walletRepository.ts`
- `src/features/wallets/` (`WalletSwitcher`, `WalletManager`)
- `tests/e2e/carteiras.spec.ts`
