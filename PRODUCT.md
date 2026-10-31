# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Projeto de estudo e portfólio: demonstra um produto completo e bem acabado, e usuários reais são secundários. O público que o app simula (personas do PRD):

- **Organizador do dia a dia (principal):** adulto que usa o celular o tempo todo e quer saber para onde vai o salário sem montar planilhas. Lança cada despesa logo depois de pagar, em pé, com uma mão.
- **Quem já usa planilha (secundária):** já anota gastos em Excel/Google Planilhas e quer lançar mais rápido no celular sem perder a planilha.

## Product Purpose

PWA mobile-first para controlar despesas diárias. Responde a qualquer momento três perguntas: **quanto gastei no mês, em quais categorias e se estou dentro do que planejei**. Sucesso: lançar uma despesa em até 10 s e 3 toques; identificar a categoria de maior gasto em até 5 s olhando o resumo; atualizar o resumo em até 300 ms após salvar, com até 5.000 lançamentos.

## Positioning

Dois diferenciais guiam as decisões:

1. **Orçamento com alertas:** limite mensal por categoria e por carteira, barra de progresso em três estados (dentro < 80%, alerta 80–100%, estourado > 100%) sempre com texto além da cor, aviso no próprio app ao entrar em alerta ou estourar, e linguagem positiva ("Restam R$ 180,00").
2. **Resumo lúdico e animado:** a visualização por categoria (bolhas proporcionais) é a peça de destaque, com proporções fiéis aos valores, cores vivas por categoria e animação quando os valores mudam, para que acompanhar os gastos seja recompensador.

Lançamento rápido e privacidade total são requisitos, não o diferencial.

## Operating Context

- Uso principal no celular, logo após um pagamento; também funciona em navegador de computador.
- Instalável na tela inicial, funciona offline após o primeiro carregamento.
- Navegação inferior: Resumo (inicial), Lançamentos, Orçamento, Mais (carteiras, exportar/importar `.xlsx`, planilha modelo, privacidade, apagar dados), com o botão "Lançar" sempre visível.
- Carteiras separam contextos (ex.: Pessoal, Casa, Viagem).
- Backup e migração por arquivos `.xlsx`, um por mês, compatíveis com Excel, Google Planilhas e LibreOffice.

## Capabilities and Constraints

- Requisitos completos em `tasks/prd-controle-gastos-diarios/prd.md`; arquitetura em `tasks/prd-controle-gastos-diarios/techspec.md`.
- Só despesas (sem receitas ou saldo). 12 categorias fixas: Alimentação, Mercado, Moradia, Transporte, Carro, Saúde, Educação, Lazer, Jogos, Vestuário, Família, Outros, cada uma com cor e ícone próprios.
- 100% local: sem conta, sem servidor, nenhum dado financeiro sai do aparelho (CSP `connect-src 'self'`). CSP estrita sem `'unsafe-inline'`.
- Pacote inicial enxuto: telas secundárias e bibliotecas de planilha e animação carregadas sob demanda.
- Apenas pt-BR e BRL; moeda `R$ 1.234,56`, datas `dd/mm/aaaa`, meses por extenso ("Outubro 2026"). Tom simples e próximo, sem jargão financeiro.
- Tema claro e escuro seguindo o sistema.
- Fora do escopo: login e nuvem, categorias personalizadas, recorrentes, streaks e conquistas, insights automáticos, notificações push, integrações bancárias, outros formatos de arquivo, apps nativos.
- **Em aberto:** o nome "Gastos do Dia" é provisório.

## Brand Commitments

- Nome atual (provisório): "Gastos do Dia", curto "Gastos". Ícone em `public/favicon.svg` (PNGs do PWA gerados a partir dele).
- Voz: português do Brasil, simples e próximo, positivo ao falar de limites; estados vazios sempre com orientação e ação.

## Evidence on Hand

- Dados de exemplo fictícios do próprio app (`src/data/sampleData`), sempre marcados como fictícios.
- Planilhas de teste em `tests/fixtures/`.
- Não há usuários reais, depoimentos, métricas de uso nem imprensa; não inventar.

## Product Principles

1. O orçamento é o centro do controle: estado, valor restante ou excedente sempre visíveis e ditos em texto.
2. O resumo deve encantar sem mentir: proporções fiéis aos valores, animação que respeita "reduzir movimento".
3. Lançar é a ação mais frequente e nunca pode ficar lenta ou escondida.
4. Os dados são do usuário e ficam no aparelho; deixe claro que limpar o navegador os apaga e incentive exportar.
5. Acabamento de portfólio: cada estado (vazio, erro, armazenamento cheio, importação inválida) é tratado.

## Accessibility & Inclusion

WCAG 2.1 AA nas telas principais: contraste 4,5:1 para texto e 3:1 para gráficos essenciais; cor nunca é o único identificador; alvos de toque ≥ 44 × 44 px; navegação por teclado com foco visível; o ranking em lista é a alternativa textual das bolhas; anúncios para leitor de tela ao salvar e em alertas de orçamento; fonte do sistema até 200% sem perda de conteúdo.
