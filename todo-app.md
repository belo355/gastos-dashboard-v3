# Melhorias sugeridas — Gastos do Dia

Pontos levantados depois do redesign no padrão Apple (commit `79d8f18`). Ordem dentro de cada seção: do mais importante para o menos. Requisitos do produto em `tasks/prd-controle-gastos-diarios/prd.md`; design system em `DESIGN.md`.

## 1. Pendências do redesign

- [x] **Cor do tema e ícones ainda com o roxo antigo.** Feito: novo ícone (barras azuis e moeda sobre quadrado preto) em `public/favicon.svg`, PNGs regerados, `theme-color` e manifest em `#f2f2f7` / `#000000`. O redesign não atualizou a identidade do PWA:
  - `index.html:10-11`: `<meta name="theme-color">` em `#4338ca` (claro) e `#0b1020` (escuro). Trocar por `#f2f2f7` / `#000000` (fundo do app) ou `#0071e3` (azul).
  - `vite.config.ts:27-28`: `background_color: '#f6f7fb'` e `theme_color: '#4338ca'` no manifest. Alinhar com os tokens novos.
  - `public/favicon.svg:2`: fundo `#4338ca`. Redesenhar no azul novo e regerar os PNG com `node scripts/make-icons.mjs`.
- [x] **Fonte fora dos aparelhos Apple.** Decidido: manter a fonte do sistema (registrado em `DESIGN.md`). No Windows e no Android o app usa Segoe UI/Roboto, porque a SF só existe em aparelhos Apple. Decidir entre manter a fonte do sistema ou hospedar uma fonte parecida com a SF (custo: peso no primeiro carregamento). Registrar a decisão em `DESIGN.md`.
- [ ] **Conferir a barra de abas translúcida num iPhone de verdade.** No Chromium sem interface o desfoque ficou fraco perto da borda da tela; a opacidade subiu para 90% para compensar. Se no Safari do iOS o desfoque estiver bom, dá para voltar a ~80% e deixar o material mais "vidro".
- [x] **Caminho morto em `src/ui/ProgressBar.tsx`.** Feito: `color` é obrigatória. Sem a prop `color`, a barra ainda pinta com `bg-warning`, o que contraria a regra "Category Fill" do `DESIGN.md`. Tornar `color` obrigatória ou trocar o padrão por `--tint`.
- [x] **Rodar o Lighthouse depois do redesign** — desempenho 97, acessibilidade 100, boas práticas 100, LCP 2,3 s. (`npm run build` e `npx @lhci/cli@0.15.1 autorun`). O CSS cresceu (escala tipográfica, materiais, animações), então vale confirmar os limites de `lighthouserc.json` (LCP ≤ 2,5 s, acessibilidade ≥ 0,95).
- [ ] **Testes de regressão visual.** Hoje nenhum teste E2E usa `toHaveScreenshot`. Adicionar capturas de referência do Resumo, do Orçamento e da sheet de lançar, em claro e escuro, para nenhuma mudança futura quebrar o visual sem aviso.

## 2. Acabamento no padrão Apple

Sugestões do revisor da skill impeccable, ainda não aplicadas:

- [x] **Linha do ranking em duas linhas**, como no Tempo de Uso: "nome · valor" e embaixo "barra · 17,2% · 4 lançamentos". Hoje são três linhas e a lista fica longa com 12 categorias.
- [x] **Anel do orçamento:** a ponta agora gira junto com o arco.
- [ ] **Anel do orçamento: gradiente angular** ao longo do arco (o SVG não tem gradiente cônico; exigiria máscara com `conic-gradient`).
- [x] **Título grande que estica ao puxar a tela para baixo** (overscroll), como no iOS.
- [x] **Botão Lançar cobre parte das bolhas.** Feito: ao rolar, o botão recolhe para um círculo com "+".
- [x] **Layout no computador:** o Resumo usa duas colunas a partir de `lg` (bolhas à esquerda, fixas ao rolar; ranking e orçamento à direita).
- [x] **Transições entre abas** com a View Transitions API (aprimoramento progressivo, respeitando "reduzir movimento").

## 3. Experiência de uso

- [ ] **Atalho "Lançar gasto" no ícone do app**: `shortcuts` no manifest abrindo `/?lancar=1`. Ajuda a meta de lançar em até 10 s.
- [ ] **Deslizar para excluir** nas linhas de lançamento (padrão do iOS), mantendo a confirmação que o RF7 exige.
- [ ] **Busca na lista de lançamentos** por descrição, dentro do mês.
- [ ] **Seletor de data próprio em pt-BR.** O campo nativo mostra o formato do navegador (ex.: `10/26/2026` com o navegador em inglês). Atalhos "Hoje / Ontem" no formulário resolveriam a maioria dos casos sem abrir o calendário.
- [x] **Animação ao lançar um gasto novo** (`src/features/app/SaveCelebration.tsx`): cartão no centro com o ícone da categoria, onda, pontos na cor dela, check desenhado e o valor; some em 1,5 s.
- [x] **Escolha do tema** em Mais → Aparência (Automático, Claro, Escuro), salva no aparelho e aplicada antes da primeira pintura (`public/theme-init.js`).
- [ ] **Vibração leve ao salvar** (`navigator.vibrate`, só no Android; o iOS ignora). Reforça a recompensa do RF5.

## 4. Produto (fora do MVP pelo PRD)

Listadas no PRD como evoluções futuras. Cada uma pede PRD e TechSpec próprios (`/criar-prd`):

- [ ] Nome definitivo do app (hoje provisório, ver `PRODUCT.md`).
- [ ] Categorias personalizadas.
- [ ] Receitas e saldo do mês.
- [ ] Lançamentos recorrentes e parcelados.
- [ ] Lembretes diários (exigiria notificações; avaliar com a privacidade).
- [ ] Insights automáticos além da comparação com o mês anterior.
- [ ] Backup opcional em nuvem (exigiria rever a CSP e a política de privacidade).

## 5. Projeto e manutenção

- [ ] **README.** Não há README na raiz. Um resumo curto com o que é o app, como rodar e capturas de tela ajuda o objetivo de portfólio.
- [ ] **Abrir PR de `develop` para `master`** com o redesign, quando os itens da seção 1 estiverem resolvidos.
