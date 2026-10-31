# Tarefa 8.0: Importar e exportar `.xlsx`

## Visão geral

Garantir portabilidade e backup: exportar uma carteira em `.xlsx`, um arquivo por mês; baixar a planilha modelo; e importar um ou mais `.xlsx` com prévia (válidos, descartados, em "Outros", meses detectados) e escolha entre substituir ou cancelar quando o mês já existir. Todo o processamento acontece no aparelho, com as bibliotecas carregadas sob demanda.

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0: cobertura de 80% em `src/domain/` e `src/data/`. `read-excel-file`/`write-excel-file` via `import()` dinâmico, nunca no bundle inicial. Sem desvios.
</rules>

<requirements>
- RF29: exportar um arquivo por mês (`gastos-<carteira-slug>-<YYYY-MM>.xlsx`), uma despesa por linha, colunas Data, Descrição, Categoria e Valor; data como célula de data, valor com formato `#,##0.00`, linhas por data crescente.
- RF30: download da planilha modelo.
- RF31: importar um ou mais arquivos para uma carteira; ler a primeira aba e localizar colunas pelo cabeçalho normalizado, em qualquer ordem.
- RF32: ignorar linhas em branco, descartar e contar as inválidas, mapear categorias desconhecidas para "Outros".
- RF33: prévia antes de confirmar.
- RF34: em mês já existente, escolher substituir ou cancelar; cancelar mantém os dados intactos.
- RF35: o arquivo nunca é enviado a servidor.
- Erros `import_unreadable`, `import_missing_columns`, `import_duplicate_month`, `import_too_large` (> 5 MB ou > 10.000 linhas), `import_empty` e `export_failed`.
- Download por `Blob` + `<a download>`, com `navigator.share({ files })` no iOS quando disponível.
- Atualizar `Settings.lastExportAt` após exportar.
</requirements>

## Subtarefas

- [x] 8.1 `importRules.normalizeRows` (cabeçalhos, validação por linha, `ImportPreview`, conflitos) e conversão de datas do Excel em `dates`.
- [x] 8.2 Testes TU-11 a TU-16 (inclui `matchCategory`, implementado na tarefa 2.0).
- [x] 8.3 `xlsxAdapter` (`parseWorkbook`, `buildMonthWorkbook`, `buildTemplate`) com carregamento dinâmico.
- [x] 8.4 `expenseRepository.replaceMonths` em uma única transação.
- [x] 8.5 Fixtures `tests/fixtures/ca15-20-linhas.xlsx`, `sem-colunas.xlsx` e `corrompido.xlsx`.
- [x] 8.6 `ExportPanel` (escolha de meses) e `TemplateDownload`.
- [x] 8.7 `ImportWizard` (escolher → prévia → conflito → confirmar).
- [x] 8.8 Testes TI-06, TI-07, E2E-08 e E2E-09.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (`importRules`, `xlsxAdapter`, `features/transfer/`), "Fluxo de dados" (passos 3 e 4), "Principais interfaces" (`XlsxAdapter`, `replaceMonths`), modelos `ImportPreview` e `AppError`, "Mapeamento planilha `.xlsx` → `ExpenseInput`", "Pontos de integração" (download de arquivos) e "Principais decisões" (`read-excel-file` + `write-excel-file`).

## Critérios de aceitação relacionados

- CA-14
- CA-15
- CA-16

## Testes da tarefa

### Testes de unidade (se aplicável)

- [x] TU-11 — `normalizeRows` localiza colunas em qualquer ordem
- [x] TU-12 — `normalizeRows` com a planilha de 20 linhas do CA-15
- [x] TU-13 — `normalizeRows` sem colunas obrigatórias
- [x] TU-14 — `normalizeRows` detecta conflitos de mês
- [x] TU-15 — Conversão de datas do Excel
- [x] TU-16 — `matchCategory` normaliza acento e caixa

### Testes de integração (se aplicável)

- [x] TI-06 — `replaceMonths` substitui atomicamente
- [x] TI-07 — Exportar e reimportar preserva os dados (ida e volta)

### Testes E2E (se aplicável)

- [x] E2E-08 — Exportar meses
- [x] E2E-09 — Importar com prévia e conflito

## Arquivos relevantes

- `src/domain/importRules.ts`, `src/domain/dates.ts`, `src/domain/categories.ts`
- `src/data/xlsxAdapter.ts`, `src/data/expenseRepository.ts`
- `src/features/transfer/` (`ExportPanel`, `ImportWizard`, `TemplateDownload`)
- `tests/fixtures/ca15-20-linhas.xlsx`, `tests/fixtures/sem-colunas.xlsx`, `tests/fixtures/corrompido.xlsx`
- `tests/e2e/transferencia.spec.ts`
