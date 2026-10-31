# Tarefa 10.0: Polimento e qualidade

## Visão geral

Fechar a experiência e a qualidade do MVP: microanimações de confirmação e atualização animada do total, estados vazios em todas as telas, auditoria de acessibilidade WCAG 2.1 AA nos temas claro e escuro, orçamento de desempenho com Lighthouse CI e configuração de deploy (rewrite da SPA, cabeçalhos de cache e Content-Security-Policy restritiva).

<skills>
### Conformidade com skills

Não existe `.agents/skills/` no projeto. Skills do fluxo aplicáveis: `executar-task`, `executar-review` e `executar-qa` (auditoria de acessibilidade e responsividade).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Não há `AGENTS.md` nem `.agents/rules/`. Seguir o `CLAUDE.md` da tarefa 1.0. As animações respeitam "reduzir movimento". Sem desvios.
</rules>

<requirements>
- RF5: feedback visual imediato ao salvar (microanimação e total animado).
- RF10 e acessibilidade: categorias e estados de orçamento identificáveis sem cor; contraste 4,5:1 para texto e 3:1 para gráficos; alvos de 44 × 44 px; navegação por teclado com foco visível; fonte do sistema até 200% sem perda de conteúdo.
- Estados vazios com orientação e ação (ex.: "Nenhum gasto em outubro ainda. Toque em Lançar para começar.").
- Desempenho: primeira carga em até 3 s em 4G; abertura instalada em até 1,5 s; Lighthouse CI com LCP ≤ 2,5 s (perfil mobile) e categoria PWA aprovada.
- Deploy em Netlify ou Vercel: rewrite `/* → /index.html`, `Cache-Control: no-cache` para `index.html` e `sw.js`, CSP `default-src 'self'; connect-src 'self'`.
</requirements>

## Subtarefas

- [x] 10.1 Microanimação de confirmação ao salvar e animação do total, com fallback sem movimento.
- [x] 10.2 Revisar e completar os estados vazios (Resumo, Lançamentos, Orçamento, Carteiras, Importação).
- [x] 10.3 Auditoria de acessibilidade: corrigir contraste, foco, rótulos, alvos de toque e zoom de 200%.
- [x] 10.4 Teste E2E-12 com `@axe-core/playwright` nas telas principais, nos dois temas.
- [x] 10.5 Lighthouse CI no pipeline com os limites definidos.
- [x] 10.6 `netlify.toml` (ou `vercel.json`) com rewrite, cabeçalhos e CSP; validar que a CSP não quebra o app nem o service worker.

> **Desvio registrado (2026-10-30):** o Lighthouse 12 removeu a categoria "PWA". A instalabilidade passou a ser verificada pelo E2E `tests/e2e/pwa.spec.ts` (manifest, ícones e service worker); o Lighthouse CI cobre LCP ≤ 2,5 s, acessibilidade ≥ 95 e boas práticas. Resultado local: desempenho 97, acessibilidade 100, boas práticas 100, LCP 2,3 s.

## Detalhes de implementação

Ver em `techspec.md`: "Pontos de integração" (hospedagem estática), "Monitoramento e observabilidade" (desempenho e Lighthouse CI), "Abordagem de testes" (E2E-12) e "Riscos conhecidos" (desempenho das animações, contraste das cores). Diretrizes de UI e acessibilidade em `prd.md`, "Experiência do usuário".

## Critérios de aceitação relacionados

- CA-19

## Testes da tarefa

### Testes E2E (se aplicável)

- [x] E2E-12 — Acessibilidade das telas principais

## Arquivos relevantes

- `src/features/**` (estados vazios e animações)
- `src/styles/tokens.css`
- `tests/e2e/acessibilidade.spec.ts`
- `netlify.toml` (ou `vercel.json`)
- `lighthouserc.json` e a configuração de CI
