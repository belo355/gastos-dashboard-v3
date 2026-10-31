# Documento de Requisitos do Produto (PRD)

**Produto:** Controle de Gastos Diários (nome provisório)
**Data:** 2026-10-29
**Referência analisada:** [Planilhou](https://planilhou.click/) — PWA de controle de gastos do mês, com dados só no aparelho, carteiras, lançamentos (data, descrição, categoria, valor), resumo por categoria com percentual e valor, visual em "mapa de metrô" por categoria, comparação com o mês anterior e importação/exportação de planilhas `.xlsx`.

## Visão geral

Pessoas que querem controlar os gastos do dia a dia costumam desistir porque anotar despesas é chato e o resultado (uma lista ou planilha) não mostra com clareza para onde o dinheiro está indo. O produto é um aplicativo web instalável (PWA), pensado primeiro para o celular, em que o usuário registra cada despesa em poucos segundos e vê imediatamente o mês resumido por categoria, em um visual lúdico e animado que transforma o registro em algo recompensador.

O valor central é responder, a qualquer momento, três perguntas: **quanto gastei no mês, em quais categorias, e se estou dentro do que planejei**. Para isso, o MVP combina lançamento rápido, resumo por categoria com ranking e percentuais, orçamento mensal por categoria com barras de progresso e alertas, carteiras para separar contextos (pessoal, casa, viagem) e importação/exportação em `.xlsx`. Todos os dados ficam somente no aparelho do usuário, sem conta e sem servidor — o app funciona offline.

## Objetivos

- **Lançamento rápido:** o usuário registra uma despesa em até **10 segundos** e em no máximo **3 toques** após abrir a tela de lançamento (medido em teste de usabilidade com ao menos 5 participantes; meta: mediana ≤ 10 s).
- **Clareza do destino dos gastos:** em teste de usabilidade, **≥ 90%** dos participantes identificam em até **5 segundos** a categoria em que mais gastaram no mês, olhando a tela de resumo.
- **Engajamento com orçamento:** **≥ 50%** dos usuários ativos definem orçamento para ao menos 1 categoria na primeira semana de uso (métrica coletada apenas se houver telemetria anônima opcional; caso contrário, validada em teste de usabilidade).
- **Retenção de hábito:** **≥ 40%** dos usuários que fizeram o primeiro lançamento registram despesas em ao menos 4 das 7 primeiras semanas (meta de produto, sujeita à mesma ressalva de telemetria).
- **Privacidade:** **0** dados financeiros enviados a servidores — verificável por inspeção de tráfego de rede durante o uso.
- **Disponibilidade offline:** **100%** das funcionalidades do MVP (exceto a primeira instalação) funcionam sem internet.
- **Desempenho percebido:** o resumo do mês reflete um novo lançamento em até **300 ms** após salvar, com até 5.000 lançamentos armazenados.
- **Acessibilidade:** **0** violações críticas em auditoria WCAG 2.1 nível AA nas telas principais.

## Histórias de usuário

**Persona principal — "Organizador do dia a dia":** pessoa adulta, usa o celular o tempo todo, quer saber para onde vai o salário sem montar planilhas complexas.

**Persona secundária — "Quem já usa planilha":** já anota gastos em Excel/Google Planilhas e quer um jeito mais rápido de lançar no celular sem perder a planilha.

- **US1:** Como organizador do dia a dia, quero lançar uma despesa (valor, categoria, data, descrição opcional) logo depois de pagar, para não esquecer de anotar.
- **US2:** Como organizador do dia a dia, quero ver o total do mês e quanto cada categoria representa (valor e %), para entender para onde meu dinheiro está indo.
- **US3:** Como organizador do dia a dia, quero ver as categorias ordenadas da que mais gastei para a que menos gastei, para saber onde agir primeiro.
- **US4:** Como organizador do dia a dia, quero definir um limite mensal por categoria e acompanhar quanto já usei, para não estourar o planejado.
- **US5:** Como organizador do dia a dia, quero ser avisado visualmente quando uma categoria se aproxima ou ultrapassa o limite, para corrigir o rumo ainda no mês.
- **US6:** Como organizador do dia a dia, quero um resumo visual atraente e animado, para que acompanhar os gastos seja agradável e não uma obrigação.
- **US7:** Como organizador do dia a dia, quero separar gastos em carteiras (ex.: "Pessoal", "Casa", "Viagem"), para analisar cada contexto separadamente.
- **US8:** Como organizador do dia a dia, quero navegar entre meses e comparar o total com o mês anterior, para saber se estou gastando mais ou menos.
- **US9:** Como organizador do dia a dia, quero editar ou excluir um lançamento errado, para manter os números corretos.
- **US10:** Como quem já usa planilha, quero exportar uma carteira em `.xlsx`, um arquivo por mês, para guardar backup ou usar em outra ferramenta.
- **US11:** Como quem já usa planilha, quero importar um `.xlsx` no formato do app para uma carteira, para trazer meu histórico ou restaurar um backup.
- **US12:** Como organizador do dia a dia, quero usar o app sem internet e sem criar conta, para lançar gastos em qualquer lugar sem expor meus dados.

**Casos de borda:**

- Primeiro acesso sem dados: o app mostra um estado vazio convidativo e pode exibir dados de exemplo claramente marcados como fictícios.
- Mês sem lançamentos: resumo zerado com convite para lançar.
- Categoria com orçamento definido e nenhum gasto: barra em 0%.
- Gasto acima de 100% do orçamento: a barra indica excesso e o valor excedente.
- Importação de planilha com linhas inválidas, colunas faltando ou mês já existente na carteira.
- Armazenamento do navegador cheio ou indisponível (ex.: navegação privada).
- Usuário limpa os dados do navegador: os dados se perdem (o app precisa deixar isso claro e incentivar a exportação).

## Principais funcionalidades

### 1. Lançamento de despesas

Registro rápido de cada gasto — é a ação mais frequente e precisa ser instantânea. Um botão de "Lançar" sempre visível abre um formulário com o campo de valor em foco, teclado numérico e a data de hoje preenchida.

- **RF1:** O usuário pode criar um lançamento com valor (obrigatório, maior que zero, em R$ com duas casas decimais), categoria (obrigatória), data (obrigatória, padrão: hoje) e descrição (opcional, até 80 caracteres).
- **RF2:** O lançamento é salvo na carteira ativa.
- **RF3:** A ação de lançar fica acessível a partir de qualquer tela principal com um toque.
- **RF4:** O app exibe mensagens de validação específicas (ex.: "Informe o valor", "Data inválida") sem apagar o que já foi digitado.
- **RF5:** Ao salvar, o app dá retorno visual imediato (microanimação/confirmação) e o resumo do mês é atualizado.
- **RF6:** O usuário pode listar os lançamentos do mês da carteira ativa, ordenados por data (mais recente primeiro), com valor, categoria, data e descrição.
- **RF7:** O usuário pode editar e excluir um lançamento; a exclusão pede confirmação e informa que não pode ser desfeita.

### 2. Categorias padrão

Conjunto fixo de categorias que cobre os gastos comuns, cada uma com nome, cor e ícone próprios, para que o resumo seja legível de relance.

- **RF8:** O app oferece as categorias: Alimentação, Mercado, Moradia, Transporte, Carro, Saúde, Educação, Lazer, Jogos, Vestuário, Família e Outros.
- **RF9:** Cada categoria tem cor e ícone distintos e consistentes em todas as telas.
- **RF10:** A cor nunca é o único meio de identificar uma categoria (sempre acompanhada de nome e/ou ícone).

### 3. Resumo do mês por categoria

Tela principal do app. Mostra para onde os gastos estão indo, com visual lúdico e animado.

- **RF11:** O resumo mostra o total gasto no mês selecionado na carteira ativa.
- **RF12:** O resumo mostra, para cada categoria com gasto, o valor total, o percentual sobre o total do mês e a quantidade de lançamentos.
- **RF13:** As categorias aparecem em ranking, da maior para a menor despesa.
- **RF14:** O resumo inclui uma visualização gráfica da distribuição por categoria, com proporções fiéis aos valores, cores das categorias e animação de entrada/atualização.
- **RF15:** Ao tocar em uma categoria, o usuário vê os lançamentos daquela categoria no mês.
- **RF16:** O usuário pode navegar para meses anteriores e seguintes.
- **RF17:** O resumo mostra a variação do total em relação ao mês anterior (valor e %), indicando se gastou mais ou menos.
- **RF18:** Animações respeitam a preferência do sistema por movimento reduzido.

### 4. Orçamento por categoria

Torna o controle ativo: o usuário planeja e acompanha quanto ainda pode gastar.

- **RF19:** O usuário pode definir, alterar e remover um limite mensal (em R$) por categoria, por carteira.
- **RF20:** O limite definido vale para o mês corrente e os seguintes, até ser alterado.
- **RF21:** Para cada categoria com limite, o app mostra uma barra de progresso com valor gasto, limite e valor restante (ou excedente).
- **RF22:** A barra muda de estado visual em três faixas: dentro do limite (< 80%), em alerta (80% a 100%) e estourado (> 100%), com texto que indica o estado além da cor.
- **RF23:** Ao salvar um lançamento que faz a categoria entrar em alerta ou estourar, o app exibe um aviso no próprio app.
- **RF24:** O resumo mostra o total orçado do mês, o total gasto nas categorias orçadas e o saldo restante.

### 5. Carteiras

Separam contextos de gasto sem misturar números.

- **RF25:** O app cria uma carteira padrão no primeiro uso.
- **RF26:** O usuário pode criar, renomear e excluir carteiras; nomes são obrigatórios e únicos.
- **RF27:** O usuário alterna a carteira ativa em um toque; lançamentos, resumo e orçamentos refletem a carteira ativa.
- **RF28:** Excluir uma carteira apaga seus lançamentos e orçamentos após confirmação explícita.

### 6. Exportar e importar `.xlsx`

Garante portabilidade e backup, já que os dados só existem no aparelho.

- **RF29:** O usuário pode exportar uma carteira em `.xlsx`, um arquivo por mês, com uma despesa por linha e as colunas data, descrição, categoria e valor.
- **RF30:** O app oferece o download de uma planilha modelo no formato aceito.
- **RF31:** O usuário pode importar um ou mais arquivos `.xlsx` para uma carteira. O app lê a primeira aba e localiza as colunas pelo nome do cabeçalho, em qualquer ordem.
- **RF32:** Na importação, linhas em branco são ignoradas; linhas com dados inválidos são descartadas e contadas; categorias não reconhecidas são atribuídas a "Outros".
- **RF33:** Antes de confirmar a importação, o app mostra uma prévia: quantidade de lançamentos válidos, linhas descartadas e meses detectados.
- **RF34:** Se o mês importado já tiver lançamentos na carteira, o usuário escolhe entre substituir ou cancelar.
- **RF35:** O arquivo é processado no próprio aparelho e nunca é enviado a servidor.

### 7. Funcionamento local e offline

- **RF36:** Todos os dados (lançamentos, carteiras, orçamentos) são salvos apenas no aparelho, sem cadastro ou login.
- **RF37:** O app pode ser instalado na tela inicial e funciona offline após o primeiro carregamento.
- **RF38:** O app informa, em local visível (ex.: tela "Sobre"/"Privacidade" e primeiro uso), que os dados ficam só no aparelho e que limpar os dados do navegador os apaga, recomendando exportar periodicamente.
- **RF39:** Se o armazenamento local falhar, o app mostra uma mensagem clara e não perde silenciosamente o que o usuário digitou.
- **RF40:** O usuário pode apagar todos os dados do aparelho, com confirmação explícita.

## Critérios de aceitação

- **CA-01 (US1, RF1–RF2):** Dado que estou na tela de lançamento, quando informo valor 25,90, categoria Alimentação e salvo, então o lançamento aparece na lista do mês corrente da carteira ativa com data de hoje.
- **CA-02 (RF4):** Dado o formulário de lançamento, quando tento salvar com valor vazio ou zero, então vejo a mensagem "Informe o valor" e os demais campos preenchidos são mantidos.
- **CA-03 (RF3, objetivo de lançamento rápido):** Dado que estou em qualquer tela principal, quando toco em "Lançar", então o formulário abre com o campo de valor em foco e teclado numérico em dispositivos móveis.
- **CA-04 (RF5, RF11–RF13):** Dado um mês com lançamentos em 3 categorias, quando salvo um novo lançamento, então o total do mês, os valores, os percentuais e o ranking das categorias são atualizados em até 300 ms.
- **CA-05 (RF12):** Dado o resumo do mês, então a soma dos percentuais das categorias é 100% (tolerância de arredondamento de ±0,1 p.p.) e a soma dos valores é igual ao total do mês.
- **CA-06 (RF15):** Dado o resumo, quando toco em uma categoria, então vejo apenas os lançamentos daquela categoria no mês selecionado.
- **CA-07 (RF16–RF17):** Dado que tenho gastos em setembro e outubro, quando vejo o resumo de outubro, então vejo a diferença em R$ e em % em relação a setembro e a indicação "gastou mais" ou "gastou menos".
- **CA-08 (RF7):** Dado um lançamento existente, quando o edito e salvo, então lista e resumo refletem o novo valor; quando o excluo e confirmo, então ele some da lista e do resumo.
- **CA-09 (RF19–RF21):** Dado que defino limite de R$ 500,00 para Mercado e tenho R$ 320,00 gastos, então vejo a barra em 64%, "R$ 320,00 de R$ 500,00" e "Restam R$ 180,00".
- **CA-10 (RF22–RF23):** Dado limite de R$ 500,00 em Mercado com R$ 380,00 gastos, quando lanço R$ 50,00 em Mercado, então a categoria passa ao estado "em alerta" (86%) e vejo um aviso; quando lanço mais R$ 100,00, então passa a "estourado" e exibe "R$ 30,00 acima do limite".
- **CA-11 (RF20):** Dado um limite definido em outubro, quando avanço para novembro, então o mesmo limite aparece aplicado a novembro.
- **CA-12 (RF25–RF27):** Dado que tenho as carteiras "Pessoal" e "Viagem", quando alterno para "Viagem", então lista, resumo e orçamentos mostram apenas os dados de "Viagem".
- **CA-13 (RF26):** Dado que existe a carteira "Casa", quando tento criar outra chamada "Casa", então vejo "Já existe uma carteira com esse nome" e nada é criado.
- **CA-14 (RF29):** Dada uma carteira com lançamentos em setembro e outubro, quando exporto, então recebo arquivos `.xlsx` por mês com as colunas data, descrição, categoria e valor, e os valores batem com o resumo de cada mês.
- **CA-15 (RF31–RF33):** Dado um `.xlsx` com 20 linhas, sendo 2 em branco, 1 com data inválida e 1 com categoria desconhecida, quando o importo, então a prévia indica 17 lançamentos válidos (1 deles em "Outros") e 1 linha descartada.
- **CA-16 (RF34):** Dado que a carteira já tem lançamentos em outubro, quando importo um arquivo de outubro, então o app pergunta se desejo substituir ou cancelar, e cancelar mantém os dados originais intactos.
- **CA-17 (RF35–RF37):** Dado o app já carregado uma vez, quando desligo a internet e recarrego, então consigo lançar, ver o resumo, gerenciar orçamentos, exportar e importar; e nenhuma requisição de rede contendo dados financeiros é feita em qualquer momento.
- **CA-18 (RF18):** Dado que o sistema operacional está com "reduzir movimento" ativado, quando abro o resumo, então as animações são desativadas ou substituídas por transições sem movimento.
- **CA-19 (RF10, acessibilidade):** Dado o resumo e as barras de orçamento, então cada categoria e cada estado de orçamento são identificáveis sem depender de cor, e todo texto tem contraste mínimo de 4,5:1.
- **CA-20 (RF39):** Dado que o armazenamento do navegador está indisponível, quando tento salvar um lançamento, então vejo "Não foi possível salvar no aparelho. Tente de novo." e o formulário mantém os dados digitados.
- **CA-21 (RF40):** Dado que tenho dados salvos, quando escolho "Apagar do aparelho" e confirmo, então todas as carteiras, lançamentos e orçamentos são removidos e o app volta ao estado de primeiro uso.

## Experiência do usuário

### Perfis e necessidades

- **Organizador do dia a dia:** precisa de lançamento em segundos, de um resumo que se entenda de relance e de um motivo para voltar ao app (o visual e o progresso do orçamento).
- **Quem já usa planilha:** precisa entrar e sair com seus dados em `.xlsx` sem retrabalho.

### Estrutura de navegação

Navegação inferior fixa (mobile) com três áreas, mais o botão de lançar sempre visível:

1. **Resumo** (tela inicial): seletor de carteira e de mês, total do mês com variação sobre o mês anterior, visualização lúdica da distribuição por categoria, ranking com valor e % e barras de orçamento.
2. **Lançamentos:** lista do mês, com filtro por categoria, edição e exclusão.
3. **Orçamento:** definição de limites por categoria e acompanhamento do progresso.
4. **Mais** (menu secundário): carteiras, exportar/importar `.xlsx`, planilha modelo, privacidade/sobre, apagar dados.

### Fluxos principais

- **Primeiro uso:** tela de boas-vindas curta (até 3 passos) explicando: lançar gastos, ver para onde vão e definir limites; aviso de que os dados ficam só no aparelho; opção de ver um exemplo com dados fictícios ou começar vazio. A carteira padrão já está criada.
- **Lançar:** tocar em "Lançar" → digitar valor → escolher categoria em grade de ícones → (opcional) ajustar data/descrição → salvar → animação de confirmação → volta ao resumo atualizado.
- **Acompanhar:** abrir o app → ver total e ranking → tocar numa categoria para ver os lançamentos.
- **Planejar:** Orçamento → escolher categoria → informar limite → ver a barra de progresso imediatamente.
- **Backup:** Mais → Exportar → escolher mês(es) → baixar `.xlsx`. Restaurar: Mais → Importar → escolher arquivo(s) → prévia → confirmar.

### Diretrizes de UI e da experiência "estimulante"

- **Visual lúdico:** o resumo por categoria deve ser a peça de destaque, com forma visual marcante (por exemplo, bolhas proporcionais, treemap ou um "mapa" de linhas por categoria, como no Planilhou), cores vivas por categoria e animação suave quando os valores mudam. A forma exata é definida no design, mas deve manter proporções fiéis aos valores.
- **Recompensa imediata:** cada lançamento salvo gera feedback visual (microanimação, atualização animada do total).
- **Progresso visível:** barras de orçamento com estados claros e linguagem positiva ("Restam R$ 180,00", "Faltam R$ 30,00 para o limite").
- **Linguagem:** português do Brasil, tom simples e próximo, sem jargão financeiro.
- **Formatação:** moeda em R$ com separador de milhar "." e decimal "," (ex.: R$ 1.234,56); datas em dd/mm/aaaa; nomes de meses por extenso no seletor (ex.: "Outubro 2026").
- **Estados vazios** sempre com orientação e ação (ex.: "Nenhum gasto em outubro ainda. Toque em Lançar para começar.").
- **Tema** claro e escuro, seguindo a preferência do sistema.

### Acessibilidade

- Conformidade com **WCAG 2.1 nível AA** nas telas principais.
- Contraste mínimo 4,5:1 para texto e 3:1 para elementos gráficos essenciais.
- Alvos de toque com no mínimo 44 × 44 px.
- Navegação completa por teclado no computador, com foco visível.
- Gráficos com alternativa textual: o ranking em lista serve como equivalente acessível da visualização.
- Rótulos acessíveis em botões só com ícone; anúncio para leitores de tela ao salvar e em alertas de orçamento.
- Respeito a "reduzir movimento" e a aumento de fonte do sistema (até 200% sem perda de conteúdo).

## Restrições técnicas de alto nível

- **Plataforma:** aplicação web responsiva e instalável (PWA), mobile-first, funcionando também em navegadores de computador. Suporte às duas últimas versões de Chrome, Safari (incluindo iOS), Edge e Firefox.
- **Sem backend para dados do usuário:** nenhum dado financeiro sai do aparelho. Não há cadastro, login nem sincronização entre dispositivos.
- **Offline:** todas as funcionalidades do MVP devem funcionar sem conexão após o primeiro carregamento.
- **Privacidade e LGPD:** como não há coleta de dados pessoais em servidor, o app deve apresentar uma política de privacidade simples explicando o armazenamento local. Qualquer telemetria futura deve ser anônima, opcional e sem conteúdo dos lançamentos.
- **Formato de arquivo:** importação e exportação em `.xlsx` compatível com Microsoft Excel, Google Planilhas e LibreOffice Calc. Processamento feito integralmente no aparelho.
- **Desempenho:** primeira carga em até 3 s em conexão 4G e aparelho intermediário; abertura subsequente (instalado) em até 1,5 s; atualização do resumo em até 300 ms com até 5.000 lançamentos.
- **Localização:** pt-BR e moeda BRL apenas.
- **Durabilidade dos dados:** o armazenamento local pode ser apagado pelo navegador ou pelo usuário. O app deve usar os mecanismos disponíveis para solicitar armazenamento persistente e incentivar a exportação periódica.

## Fora do escopo

- Conta de usuário, login, sincronização em nuvem e compartilhamento de carteiras entre pessoas.
- Registro de receitas/entradas e cálculo de saldo (o MVP trata apenas despesas).
- Categorias personalizadas (criar, renomear ou excluir categorias); o MVP usa a lista padrão fixa.
- Lançamentos recorrentes ou parcelados automáticos.
- Gamificação por sequência de dias (streaks), medalhas e conquistas.
- Insights automáticos em texto além da comparação do total com o mês anterior.
- Notificações push e lembretes fora do app.
- Integração com bancos, Open Finance, leitura de SMS/notificações, fotos de nota fiscal ou OCR.
- Lançamento por WhatsApp, voz ou assistentes.
- Importação/exportação em CSV, PDF, OFX ou outros formatos além de `.xlsx`.
- Múltiplas moedas e outros idiomas.
- Aplicativos nativos para lojas (App Store/Google Play).
- **Possíveis evoluções futuras:** categorias personalizadas, receitas e saldo, recorrentes, streaks e conquistas, insights automáticos, lembretes diários e backup opcional em nuvem.
