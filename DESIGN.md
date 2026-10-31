---
name: Gastos do Dia
description: Controle de gastos diários em PWA local, com idiomas da interface do iOS na web.
colors:
  bg: "#f2f2f7"
  surface: "#ffffff"
  surface-2: "#e9e9ee"
  border: "#c6c6c8"
  separator: "#d8d8dc"
  text: "#1d1d1f"
  text-muted: "#636366"
  primary: "#0071e3"
  primary-ink: "#ffffff"
  tint: "#0066cc"
  tint-fill: "#e3eefa"
  focus: "#0066cc"
  material: "rgb(249 249 251 / 0.9)"
  surface-bar: "#f9f9fb"
  scrim: "rgb(0 0 0 / 0.32)"
  ok: "#1e7b34"
  warning: "#9a4a00"
  danger: "#d70015"
  ok-bg: "#e4f4e8"
  warning-bg: "#fff2dc"
  danger-bg: "#ffebec"
  cat-alimentacao: "#c93400"
  cat-mercado: "#1e7b34"
  cat-moradia: "#0040dd"
  cat-transporte: "#0071a4"
  cat-carro: "#d70015"
  cat-saude: "#d30f45"
  cat-educacao: "#3634a3"
  cat-lazer: "#a14a00"
  cat-jogos: "#8944ab"
  cat-vestuario: "#7f6545"
  cat-familia: "#0c7d77"
  cat-outros: "#636366"
  cat-ink: "#ffffff"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: "2.5625rem"
    letterSpacing: "0.012em"
  title1:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.125rem"
  title2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: "1.75rem"
  title3:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.5625rem"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: "1.375rem"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: "1.375rem"
    letterSpacing: "-0.0255em"
  callout:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.3125rem"
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: "1.25rem"
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
  caption2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "0.8125rem"
  figure-hero:
    fontFamily: "ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  figure-entry:
    fontFamily: "ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  field: "12px"
  group: "16px"
  toast: "22px"
  alert: "24px"
  sheet: "28px"
  capsule: "9999px"
spacing:
  gutter: "16px"
  stack: "12px"
  panel: "16px"
  touch: "44px"
  row: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.capsule}"
    padding: "8px 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.tint-fill}"
    textColor: "{colors.tint}"
    typography: "{typography.headline}"
    rounded: "{rounded.capsule}"
    padding: "8px 20px"
    height: "48px"
  button-ghost:
    textColor: "{colors.tint}"
    typography: "{typography.headline}"
    rounded: "{rounded.capsule}"
    padding: "8px 20px"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    typography: "{typography.headline}"
    rounded: "{rounded.capsule}"
    padding: "8px 20px"
    height: "48px"
  icon-button-plain:
    textColor: "{colors.tint}"
    rounded: "{rounded.capsule}"
    size: "44px"
  icon-button-filled:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.capsule}"
    size: "44px"
  launch-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.capsule}"
    padding: "0 24px 0 20px"
    height: "56px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "48px"
  field-label:
    textColor: "{colors.text-muted}"
    typography: "{typography.subhead}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.group}"
    padding: "{spacing.panel}"
  grouped-list:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.group}"
  grouped-row:
    height: "{spacing.row}"
    padding: "10px 12px 10px 16px"
  wallet-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.subhead}"
    rounded: "{rounded.capsule}"
    padding: "0 16px"
    height: "44px"
  wallet-chip-active:
    backgroundColor: "{colors.text}"
    textColor: "{colors.surface}"
  state-pill-ok:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
    typography: "{typography.caption}"
    rounded: "{rounded.capsule}"
    padding: "2px 8px"
  state-pill-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.capsule}"
    padding: "2px 8px"
  state-pill-over:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.capsule}"
    padding: "2px 8px"
  progress-track:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.capsule}"
    height: "8px"
  tab-bar:
    backgroundColor: "{colors.material}"
    textColor: "{colors.text-muted}"
    typography: "{typography.caption2}"
    height: "56px"
  tab-bar-active:
    textColor: "{colors.tint}"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "8px 20px 20px"
  alert:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.alert}"
    padding: "20px"
    width: "320px"
---

# Design System: Gastos do Dia

## Overview

**Creative North Star: "Como se a Apple tivesse lançado"**

O app se lê como um app de sistema do iPhone levado para a web: títulos grandes que recolhem numa barra translúcida ao rolar, listas agrupadas inset sobre o fundo cinza agrupado, ícones de categoria em squircle como os dos Ajustes, sheets que sobem da base com alça, botões em cápsula. Cada peça é um idioma da Human Interface Guidelines reconhecível, não uma imitação decorativa; a densidade é a do iOS (corpo de 17 px, alvos de 44 px, linhas de lista de 64 px).

O mundo recusa o painel genérico de cartões empilhados com um cartão-herói colorido. O destaque não vem de cor de fundo, e sim de números grandes em SF Rounded (como nos apps Saúde e Atividade), das bolhas de categoria em cores do sistema e do anel de orçamento no estilo do app Atividade. Superfícies são planas e brancas (pretas no escuro); profundidade só existe no que flutua.

Claro por padrão, escuro pela preferência do sistema, com os pares de cores claro/escuro da própria Apple. Todo movimento segue as curvas do iOS e desaparece por completo com "reduzir movimento".

**Key Characteristics:**

- Fundo agrupado `#f2f2f7` / preto puro, células brancas / `#1c1c1e`, sem bordas em volta dos grupos.
- Escala tipográfica do Dynamic Type (tamanho padrão) em rem; pilha SF do sistema; dinheiro em SF Rounded tabular.
- Doze cores de categoria = cores do sistema Apple, com tinta branca no claro e preta no escuro.
- Azul em dois papéis: `primary` preenche botões, `tint` é link, ícone, aba ativa e anel.
- Materiais translúcidos (blur 20 px, saturação 180%) só nas barras fixas.
- Cápsulas para ações, raio 16 px para grupos, raios maiores para o que flutua.

## Colors

Paleta de sistema do iOS: neutros agrupados, um azul de sistema em dois tons e doze cores de categoria que são as próprias cores do sistema da Apple. Os valores do frontmatter são os do tema claro; os do escuro estão em `src/styles/tokens.css` e no sidecar.

### Primary

- **Azul de Preenchimento** (`primary`): fundo dos botões preenchidos, da cápsula flutuante "Lançar" e do ícone da tela de boas-vindas. Igual nos dois temas, sempre com texto `primary-ink` branco.
- **Azul de Sistema** (`tint`; escuro `#409cff`): links, ícones de barra, aba ativa, controles de mês, linha "Primeiro mês com gastos", cursor e anel de orçamento. `tint-fill` é o fundo dos botões tingidos (secundários) e da seleção de texto. `focus` acompanha o `tint`.

### Secondary

- **Cores de Categoria** (`cat-*`): cores do sistema Apple. No claro, as variantes de "Aumentar contraste" com tinta `cat-ink` branca; no escuro, as cores escuras do sistema (`#ff9f0a`, `#30d158`, `#0a84ff`…) com tinta `cat-ink` preta. Preenchem bolhas, squircles de categoria, barras de participação do ranking e barras de orçamento dentro do limite.

### Tertiary

- **Estados** (`ok`, `warning`, `danger` e seus `-bg`): verde, âmbar e vermelho do sistema. `ok`/`danger` colorem o saldo, a comparação com o mês anterior e erros de campo; `danger` também é o botão destrutivo. `warning` é texto: aparece na cápsula de estado "alerta" (e no ícone do aviso de carteira fictícia sobre `warning-bg`), nunca como preenchimento de barra.

### Neutral

- **Cinza Agrupado** (`bg`; escuro `#000000`): o chão de todas as telas.
- **Célula** (`surface`; escuro `#1c1c1e`): grupos, painéis, sheets, alertas, toast.
- **Preenchimento** (`surface-2`; escuro `#2c2c2e`): campos, trilhas de barra, hover de linhas, círculo do botão fechar.
- **Rótulo** (`text`) e **Rótulo Secundário** (`text-muted`): texto principal e de apoio.
- **Separador** (`separator`): linhas finas entre itens de lista e bordas das barras; **Borda** (`border`): alça da sheet, chevrons de navegação, barra de rolagem.
- **Material** (`material`, recaída opaca `surface-bar`) e **Véu** (`scrim`): barras translúcidas e fundo de modais.

### Named Rules

**The Two Blues Rule.** `primary` só preenche; `tint` só pinta texto, ícone e traço sobre superfícies. Nunca troque um pelo outro.

**The Category Fill Rule.** Uma barra de orçamento se pinta com a cor da sua categoria enquanto está no limite; acima de 100% passa a `danger` com listras diagonais. O anel geral é `tint` e passa a `danger` só quando estoura. O estado "alerta" se diz em texto e na cápsula, não muda a barra.

**The Tested Contrast Rule.** Toda cor sai de `src/styles/tokens.css` e todo par texto/fundo e gráfico/fundo é verificado em `src/styles/contrast.test.ts` (4,5:1 texto, 3:1 gráficos). Cor nova sem teste não entra. Cor nunca é o único identificador: estado tem ícone e rótulo, estouro tem listras.

## Typography

**Display/Body Font:** pilha do sistema SF (`-apple-system`, `SF Pro Text`/`SF Pro Display`, com `system-ui`, Segoe UI, Roboto como recaída)
**Figure Font:** SF Rounded (`ui-rounded`, `SF Pro Rounded`, recaindo na pilha do sistema), sempre com algarismos tabulares

**Character:** a voz é a do próprio sistema; só o dinheiro ganha a forma arredondada dos apps Saúde e Atividade, o que separa números de rótulos sem trazer uma segunda família estranha ao mundo.

### Hierarchy

- **Large Title** (700, 2.125rem/2.5625rem, +0.012em): o `h1` de cada aba, à esquerda; recolhe para Headline centralizado na barra translúcida ao rolar.
- **Title 1–3** (700): Title 2 é o título de sheet; Title 3 é cabeçalho de seção, título de estado vazio e porcentagem de orçamento; Title 1 é o valor do campo de dinheiro padrão.
- **Headline** (600, 1.0625rem): rótulos de botão, mês atual, título de alerta, subtítulos dentro de painel.
- **Body** (400, 1.0625rem/1.375rem, −0.0255em): texto corrido e campos.
- **Subhead** (600 em rótulos, 400 em apoio; 0.9375rem): rótulos de campo, chips de carteira, termos do orçamento, linha de comparação.
- **Footnote / Caption / Caption 2**: rodapés de seção e valores secundários; cápsulas de estado (Caption 600); rótulos da barra de abas (Caption 2, 500).
- **Figures** (SF Rounded 700, tabular, −0.01em): total do mês a 2.625rem; valor de lançamento a 3.25rem; todo valor em R$ e porcentagem usa a classe de número.

### Named Rules

**The Rounded Money Rule.** Todo valor monetário e porcentagem usa a família arredondada com `tabular-nums`; rótulos nunca usam.

**The Dynamic Type Rule.** Tamanhos só da escala `--text-*` em rem (os dois números-herói são as únicas exceções); nada em px, para acompanhar o zoom até 200%.

### Fonte fora dos aparelhos Apple

Fora de aparelhos Apple, a pilha cai para a sans da plataforma (Segoe UI no Windows, Roboto no Android), porque a SF não pode ser auto-hospedada. **Decidido: manter a fonte do sistema.** Uma webfont parecida com a SF pesaria no primeiro carregamento do PWA e não seria a SF de qualquer forma; nos aparelhos Apple, público principal do visual, a SF e a SF Rounded já aparecem.

## Layout

Coluna única centrada com no máximo 672 px (`max-w-2xl`); só o Resumo se abre em duas colunas a partir de `lg` (até 1024 px, `lg:max-w-5xl`: cartão do mês com as bolhas à esquerda, fixo ao rolar; ranking e orçamento à direita), margem lateral de 16 px e pilha vertical com 12 px entre blocos. Seções seguem o padrão do iOS: cabeçalho de seção em Title 3 com ação opcional à direita, grupo branco embaixo, rodapé em Footnote fora do grupo. No computador o mesmo layout fica centrado; sheets viram painéis centralizados a partir de 640 px. A barra de abas fica fixa na base com respeito à área segura; a cápsula "Lançar" flutua acima dela, à direita, alinhada à borda da coluna. O conteúdo reserva espaço inferior (`pb-44`) para não ficar sob os dois.

Alvos de toque têm no mínimo 44 × 44 px; linhas de lista de navegação têm 64 px; botões de texto, 48 px.

## Elevation & Depth

Sistema plano por camadas tonais: o fundo cinza agrupado e as células brancas fazem a separação, sem sombra e sem borda. Sombra existe só em elementos que flutuam acima do conteúdo, e o material translúcido só nas barras fixas.

### Shadow Vocabulary

- **Sheet** (`box-shadow: 0 -8px 40px -12px rgb(0 0 0 / 0.35)`): sheets e alertas sobre o véu.
- **Flutuante** (`box-shadow: 0 10px 28px -8px rgb(0 0 0 / 0.45)`): a cápsula "Lançar".
- **Toast** (`box-shadow: 0 12px 32px -10px rgb(0 0 0 / 0.35)`, com anel de 1 px `separator`): avisos no topo.
- **Ponta do anel** (`drop-shadow(1px 0 2px rgb(0 0 0 / 0.35))`): a ponta do anel de orçamento quando passa de 90%, como no Atividade.

### Named Rules

**The Floating-Only Shadow Rule.** Grupos, painéis e linhas nunca têm sombra; só o que flutua (sheet, alerta, toast, cápsula Lançar) a recebe.

**The Material Bar Rule.** Barras fixas usam `material` com `backdrop-filter: saturate(180%) blur(20px)` e um separador fino; sem suporte a desfoque, ficam opacas em `surface-bar`.

## Shapes

Geometria contínua do iOS: cápsulas para tudo que é ação ou filtro (botões, chips de carteira, cápsulas de estado, trilhas de barra), raio 16 px para grupos e painéis, 12 px para campos, e raios crescentes no que flutua (toast 22 px, alerta 24 px, sheet 28 px no topo). Ícones de categoria são squircles com raio de 24% do lado, com glifo de traço 2.25 a 58% do tamanho. Separadores de lista começam depois do ícone, nunca na borda do grupo.

## Components

### Buttons

Cápsulas táteis que encolhem ao toque (`scale(0.97)`, 160 ms).

- **Shape:** cápsula (9999px), altura mínima 48 px, Headline 600.
- **Primary:** `primary` com `primary-ink`; hover clareia (`brightness 110%`).
- **Secondary:** tingido, `tint-fill` com texto `tint`.
- **Ghost:** texto `tint` sem fundo; hover `surface-2`.
- **Danger:** `danger` com texto `surface`.
- **IconButton:** 44 px; "plain" é o ícone azul das barras; "filled" é o círculo cinza de fechar das sheets. Sempre com rótulo acessível.
- **Disabled:** opacidade 50%.

### Chips

- **Wallet chips:** cápsulas de 44 px em Subhead 600 com ícone de carteira; inativa `surface`/`text`, ativa invertida (`text` de fundo, `surface` de texto), com `aria-pressed`. Rolam na horizontal sem barra.
- **State pill:** cápsula Caption 600 com ícone + rótulo: `ok-bg`/`ok`, `warning-bg`/`warning`, `danger-bg`/`danger`.

### Cards / Containers

- **Panel e GroupedList:** `surface`, raio 16 px, sem borda nem sombra; painel com 16 px de respiro. Linhas de lista com squircle à esquerda e corpo (`.row-body`) que recebe o separador superior. Hover/press de linha em `surface-2`.
- **Cartão do mês:** um único painel com rótulo Subhead, total em número-herói, contagem, linha de comparação com ícone de tendência e, após separador, as bolhas na largura do cartão.

### Inputs / Fields

- **Style:** preenchido `surface-2`, raio 12 px, 48 px de altura, sem borda; rótulo Subhead 600 `text-muted` acima.
- **Focus:** anel de 2 px `tint` (o foco de teclado global é contorno de 3 px `focus` com 2 px de afastamento).
- **Error:** anel de 2 px `danger` e mensagem Subhead 600 `danger` com `role="alert"`.
- **MoneyInput hero:** "R$" em Title 1 `text-muted` colado a um valor de 3.25rem centralizado, como no Apple Cash; ganha fundo `surface-2` no foco.
- **Escolhas:** nunca `<select>` nativo; seleção por grade de categorias e listas.

### Navigation

- **Barra de abas:** quatro abas em material translúcido, ícone de 25 px sobre rótulo Caption 2; ativa em `tint` com traço 2.5, inativa `text-muted` com traço 1.9.
- **Título grande:** Large Title à esquerda; ao sair da tela, um título compacto aparece centralizado na barra translúcida do topo (opacidade 220 ms, deslize de 4 px em 320 ms).
- **Mês:** chevrons `tint` de 44 px em volta do mês em Headline; "Voltar para hoje" em Footnote `tint` quando fora do mês atual.

### Sheets e alertas

Sheet sobe da base (460 ms, `ease-apple`) com alça de 36 × 5 px `border`, título Title 2 e botão fechar preenchido; até 92% da altura. Alerta é compacto e centralizado (320 px), surge de `scale(1.12)` e assenta (300 ms). Véu `scrim` com fade.

### Anel de orçamento (assinatura)

Anel de 96 px e traço de 14 px como os anéis do Atividade: trilha da mesma cor a 18%, arco com ponta arredondada animado em 900 ms; acima de 100% uma segunda volta em `text` a 35% mostra o excesso. Ao lado, Orçado, Gasto e Saldo/Acima do orçado em números arredondados, com a porcentagem no centro. Decorativo: os números dizem o mesmo em texto.

### Bolhas de categoria (assinatura)

Círculos proporcionais ao gasto, na cor da categoria, com ícone, porcentagem e nome em `cat-ink`; entram com mola (rigidez 170, amortecimento 22, massa 0.9) e filtram ao toque. O ranking em lista é a alternativa textual.

### Barras de progresso

Trilha `surface-2` de 8 px (6 px no ranking), cápsula. Enchem com a cor da categoria em 700 ms `ease-out-expo`; estouro em `danger` com listras diagonais. Valor e estado sempre em `aria-valuetext`.

## Do's and Don'ts

### Do:

- **Do** usar só tokens de `src/styles/tokens.css` e acrescentar todo par novo a `src/styles/contrast.test.ts`.
- **Do** preencher botões com `primary` e pintar links, ícones e traços com `tint`.
- **Do** colocar conteúdo em grupos `surface` de raio 16 px sobre `bg`, com separador começando depois do ícone.
- **Do** escrever todo valor em R$ e porcentagem na família arredondada com algarismos tabulares.
- **Do** dar a todo estado texto e ícone além da cor; estouro ganha listras.
- **Do** animar com `ease-apple` (sheets) e `ease-out-expo` (toques, barras, anel), toque com `scale(0.97)`, e deixar "reduzir movimento" desligar todas as animações e transições.
- **Do** manter alvos de toque com no mínimo 44 × 44 px.

### Don't:

- **Don't** montar a tela como pilha de cartões com um cartão-herói colorido; o destaque vem do número e das bolhas, não de fundo de cor.
- **Don't** pôr sombra ou borda em grupos e painéis; sombra só no que flutua.
- **Don't** usar `warning` como preenchimento de barra nem trocar a cor da barra no estado "alerta".
- **Don't** usar `<select>` nativo nem atributos `style` em HTML estático (a CSP proíbe `'unsafe-inline'`).
- **Don't** usar tamanhos de fonte fora da escala `--text-*` além dos dois números-herói.
