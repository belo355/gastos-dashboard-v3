# Tarefa 9.0: PWA e privacidade

## Visão geral

Tornar o app instalável e offline, e deixar claro que os dados ficam só no aparelho: service worker com Workbox (`registerType: 'prompt'`), manifest e ícones, pedido de armazenamento persistente após o primeiro lançamento, boas-vindas em até 3 passos com opção de dados de exemplo, tela Sobre/Privacidade (com espaço usado e lembrete de exportação) e "Apagar do aparelho".

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa` (verificação offline e de tráfego com a ferramenta de navegador).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0. Nenhum dado financeiro pode sair do aparelho. Os E2E rodam contra o build de produção para incluir o service worker. Sem desvios.
</rules>

<requirements>
- RF25: carteira padrão já criada no primeiro uso.
- RF36: dados apenas no aparelho, sem cadastro nem login.
- RF37: instalável na tela inicial e funcional offline após o primeiro carregamento.
- RF38: aviso visível (boas-vindas e Sobre/Privacidade) de que os dados ficam só no aparelho e de que limpar o navegador os apaga, recomendando exportar.
- RF39: armazenamento indisponível tratado com mensagem clara (verificação E2E do CA-20).
- RF40: apagar todos os dados com confirmação explícita, voltando ao primeiro uso.
- Carteira de exemplo como carteira real (`isSample: true`) com o rótulo "Exemplo · dados fictícios".
- `navigator.storage.persist()` após o primeiro lançamento salvo; resultado em `Settings.persistenceGranted`.
- Lembrete de exportação no "Mais" após 30 dias (`lastExportAt`); espaço usado via `navigator.storage.estimate()`.
- Toast "Atualizar" quando houver nova versão do service worker.
</requirements>

## Subtarefas

- [x] 9.1 `vite-plugin-pwa`: manifest, ícones em `public/`, precache e `navigateFallback: '/index.html'`, toast de atualização.
- [x] 9.2 `storageGuard.requestPersistence()` chamado após o primeiro lançamento.
- [x] 9.3 `sampleData` e `Welcome` (até 3 passos, aviso de privacidade, exemplo ou começar vazio).
- [x] 9.4 `AboutPrivacy` (política simples, espaço usado, recomendação de exportar) e lembrete de 30 dias no "Mais".
- [x] 9.5 `WipeData` com confirmação explícita, limpando todas as tabelas e voltando ao primeiro uso.
- [x] 9.6 Testes TI-11, E2E-10 (com listener de `request` em toda a suíte), E2E-13 e E2E-14.

## Detalhes de implementação

Ver em `techspec.md`: "Visão dos componentes" (`features/onboarding/`, `features/settings/`, `sampleData`, `storageGuard`), modelo `Settings`, "Pontos de integração" (Storage API, Service Worker) e "Riscos conhecidos" (perda de dados no Safari/iOS).

## Critérios de aceitação relacionados

- CA-17
- CA-20
- CA-21

## Testes da tarefa

### Testes de integração (se aplicável)

- [x] TI-11 — `WipeData` apaga tudo e volta ao primeiro uso

### Testes E2E (se aplicável)

- [x] E2E-10 — Funcionamento offline e ausência de tráfego de dados
- [x] E2E-13 — Armazenamento indisponível
- [x] E2E-14 — Apagar dados do aparelho

## Arquivos relevantes

- `vite.config.ts` (configuração do PWA)
- `public/` (ícones, favicon)
- `src/data/storageGuard.ts`, `src/data/sampleData.ts`, `src/data/settingsRepository.ts`
- `src/features/onboarding/Welcome.tsx`
- `src/features/settings/` (`AboutPrivacy`, `WipeData`)
- `tests/e2e/offline.spec.ts`, `tests/e2e/privacidade.spec.ts`
