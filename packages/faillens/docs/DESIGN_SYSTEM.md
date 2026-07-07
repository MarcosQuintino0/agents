# FailLens — Design System

Documento de referência do sistema visual usado no relatório FailLens (relatório de regressão de API para QA/devs). Cobre cor, tipografia, ícones, espaçamento, componentes, estados, motion, terminologia e diretrizes de tema claro/escuro. Baseado no protótipo `FailLens Redesign v0.4`.

---

## 1. Princípios do sistema

1. **Cor com função, não decoração.** Cor saturada (vermelho, verde, âmbar, azul-petróleo) é reservada para *pequenos* elementos que carregam significado de status: badges, chips, dots, ícones de resultado. Cards, fundos e bordas permanecem neutros (cinza/grafite) mesmo quando o conteúdo é uma falha — isso evita o efeito "tela gritando vermelho" quando há muitas falhas na tela.
2. **Hierarquia por posição e tipografia, não por caixa.** Em vez de várias caixas com bordas coloridas competindo entre si, o destaque vem de: 1 card-herói (diagnóstico/resultado) sempre no topo, cards de apoio ao lado, detalhe secundário em accordion fechado por padrão.
3. **Densidade confortável.** Espaçamento generoso o bastante para não cansar em sessões longas de debug, sem desperdiçar tela.
4. **Tudo em português, um glossário só.** Sem misturar "failed"/"passed" (inglês) com "falha"/"aprovado" (português). Ver seção 8.
5. **Escala > exemplo único.** Todo componente de navegação (sidebar, accordions) precisa se comportar bem com 5 suítes × 20 testes, não só com o cenário de demonstração.

---

## 2. Cores

Duas paletas completas — dark (padrão) e light —, com os **mesmos papéis semânticos** em ambas. Nunca inventar uma cor fora desse conjunto; se precisar de uma variação, derive com opacidade (`Soft`/`Line`) do token base.

### 2.1 Paleta Dark (padrão)

| Token | Hex / valor | Uso |
|---|---|---|
| `bg` | `#0b0e14` | Fundo geral da aplicação (atrás da sidebar e do main) |
| `surface` | `#131720` | Fundo de cards, inputs, botões secundários, painéis |
| `surfaceSoft` | `#0e121a` | Fundo de blocos "dentro" de um card (code blocks, sidebar, proof items) — um tom mais escuro que `surface` para criar profundidade sutil |
| `border` | `#212836` | Borda padrão de cards, inputs, divisores |
| `borderStrong` | `#2c3444` | Borda de elementos com mais destaque (tab ativa, drawer, modal) |
| `text` | `#e8ecf4` | Texto principal |
| `muted` | `#8b93a7` | Texto secundário (subtítulos, metadados, corpo de texto descritivo) |
| `faint` | `#566072` | Texto terciário (timestamps, labels bem discretos, ícones inativos) |
| `accent` | `#35c3d1` | Cor de marca — ações primárias, links, elementos interativos, chip ativo |
| `accentSoft` | `rgba(53,195,209,.16)` | Fundo de chip/badge de acento |
| `accentLine` | `rgba(53,195,209,.34)` | Borda de chip/badge de acento |
| `success` | `#3ecf8e` | Estado de sucesso/aprovado |
| `successSoft` / `successLine` | `rgba(62,207,142,.14)` / `.3` | Fundo/borda de badge de sucesso |
| `warning` | `#e3a13c` | Estado de alerta/pulado (skip) |
| `warningSoft` / `warningLine` | `rgba(227,161,60,.14)` / `.3` | Fundo/borda de badge de alerta |
| `error` | `#ef5b6f` | Estado de falha |
| `errorSoft` / `errorLine` | `rgba(239,91,111,.15)` / `.34` | Fundo/borda de badge de falha |
| `info` | `#5b9bff` | Informação neutra (chaves de JSON, tag "api") |
| `infoSoft` / `infoLine` | `rgba(91,155,255,.14)` / `.3` | Fundo/borda de badge informativo |
| `onAccent` | `#08191c` | Cor do texto sobre um fundo `accent` (botão primário) |
| `trackFaint` | `rgba(255,255,255,.08)` | Trilho neutro de barra de progresso/duração |
| `dividerFaint` | `rgba(255,255,255,.06)` | Linha divisória quase invisível (separação entre suítes na sidebar) |

### 2.2 Paleta Light

| Token | Hex / valor |
|---|---|
| `bg` | `#f4f4f8` |
| `surface` | `#ffffff` |
| `surfaceSoft` | `#eef0f5` |
| `border` | `#dcdce6` |
| `borderStrong` | `#c5c5d6` |
| `text` | `#181923` |
| `muted` | `#5d5f74` |
| `faint` | `#8d8fa3` |
| `accent` | `#0f8a96` (petróleo mais escuro que no dark, para manter contraste em fundo branco) |
| `accentSoft` / `accentLine` | `rgba(15,138,150,.1)` / `.28` |
| `success` | `#15803d` |
| `successSoft` / `successLine` | `rgba(21,128,61,.1)` / `.26` |
| `warning` | `#946217` |
| `warningSoft` / `warningLine` | `rgba(148,98,23,.1)` / `.26` |
| `error` | `#c23a5c` |
| `errorSoft` / `errorLine` | `rgba(194,58,92,.1)` / `.26` |
| `info` | `#2557c7` |
| `infoSoft` / `infoLine` | `rgba(37,87,199,.1)` / `.26` |
| `onAccent` | `#ffffff` |
| `trackFaint` | `rgba(20,20,30,.08)` |
| `dividerFaint` | `rgba(20,20,30,.08)` |

**Regra de conversão dark↔light:** todo token semântico (success/warning/error/info/accent) tem uma versão mais escura/saturada no light theme para manter contraste em fundo branco — nunca reutilize o valor hex do dark theme direto no light.

### 2.3 Quando usar cada cor de status

- **Vermelho (`error`)** — teste falhou, campo divergente, validação quebrada, badge "Falhou".
- **Verde (`success`)** — teste aprovado, validação cumprida, badge "Aprovado".
- **Âmbar (`warning`)** — teste pulado (skip), badge "Pulado". *Não* usar âmbar para "atenção genérica" fora do contexto de skip.
- **Azul-petróleo (`accent`)** — a única cor de "ação"/"marca": botão primário, link, item de navegação ativo (chip, tab, chevron de suíte aberta). Nunca reutilizar para status.
- **Azul-info (`info`)** — só para sintaxe de código (chaves JSON) e a tag "api" nos itens de prova. É neutro-informativo, não é um "quarto status".

### 2.4 Sombras

| Token | Dark | Light |
|---|---|---|
| Sombra de card | `0 1px 4px rgba(0,0,0,.28)` | `0 1px 3px rgba(20,20,30,.08)` |
| Sombra de drawer | `-20px 0 60px rgba(0,0,0,.4)` | `-20px 0 60px rgba(20,20,30,.12)` |
| Sombra de modal | `0 24px 80px rgba(0,0,0,.5)` | `0 24px 60px rgba(20,20,30,.16)` |

Sombras sempre mais discretas no light theme (opacidade menor) — sombra pesada em fundo branco parece suja, não elegante.

---

## 3. Tipografia

### 3.1 Famílias

| Fonte | Uso |
|---|---|
| **Inter** (`'Inter', ui-sans-serif, system-ui, sans-serif`) | Fonte principal — todo texto de interface: títulos, corpo, labels, botões, navegação. Escolhida por ser extremamente legível em tamanhos pequenos e neutra o bastante para uma ferramenta técnica sem parecer fria. |
| **JetBrains Mono** (`'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`) | Fonte de código — reservada para: blocos de JSON/cURL/log, endpoints, IDs, timestamps de arquivo (`produtos.cy.ts:152:27`), badges/chips com contagem numérica, texto dentro de `<pre>`. Nunca usar em títulos ou parágrafos de prosa. |

**Regra de decisão rápida:** se o texto é algo que um humano escreveu como frase (título, explicação, rótulo de botão) → Inter. Se é algo que um sistema gerou ou que representa um valor técnico literal (payload, path de arquivo, status HTTP, contagem) → JetBrains Mono.

### 3.2 Escala tipográfica

| Elemento | Tamanho | Peso | Observações |
|---|---|---|---|
| Título do teste (H2, header principal) | 19px | 800 | `letter-spacing: -.02em` |
| Título de diagnóstico/resultado (H3) | 15.5px | 800 | `letter-spacing: -.02em`, `line-height: 1.4` |
| Título de card (H4) | 13px | 700 | — |
| Subtítulo de card | 10px | 400 | Cor `muted` |
| Corpo de texto (parágrafo) | 12px | 400 | `line-height: 1.65` |
| Label microcopy (uppercase) | 9.5–10px | 800 | `letter-spacing: .06–.08em`, `text-transform: uppercase` |
| Badge/chip/tag | 9–11px | 700–800 | Fonte de código quando envolve contagem/status |
| Código / JSON / cURL | 12px | 400–500 | `line-height: 1.75–1.8`, sempre fonte de código |
| Metadados de arquivo (`arquivo.ts:linha`) | 9.5–10.5px | 400–700 | Sempre fonte de código |

Nunca usar texto abaixo de **9px** em nenhum contexto.

**Pesos carregados:** Inter em 400/500/600/700/800; JetBrains Mono em 400/500/600 (código não precisa de peso 800 — negrito em código vira ruído visual, não hierarquia).

---

## 4. Ícones

**Estilo:** outline (contorno), nunca preenchido sólido — `stroke-width` entre 1.8 e 2.6, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"` (exceto o ícone de "pulado", que usa preenchimento sólido por ser um glifo geométrico simples). Tamanho padrão: 9–16px dependendo do contexto (ícone inline em contagem = 9–10px; ícone de botão = 12–16px).

**Regra crítica:** símbolos de status (falhou/aprovado/pulado) devem **sempre ser SVG**, nunca caractere Unicode solto (×, ✓, ◌) — fontes não têm garantia de conter esses glifos no mesmo estilo visual do resto do texto, o que quebra a consistência mesmo com `font-family` correto declarado.

### 4.1 Glossário de ícones

| Situação | Ícone | Cor |
|---|---|---|
| Falhou | X (duas linhas cruzadas) | `error` |
| Aprovado | Checkmark (polyline) | `success` |
| Pulado | Fast-forward (dois chevrons duplos ▶▶) | `warning` |
| Buscar | Lupa (círculo + linha) | `faint` |
| Copiar | Retângulo + path (duas folhas sobrepostas) | `muted` |
| Expandir (abrir modal) | 4 setas apontando para fora dos cantos | `muted` |
| Colapsar / chevron de accordion | Chevron simples, gira 90–180° via `transform` | `muted` |
| Tema claro/escuro | Sol (dark→light) / Lua (light→dark) | `muted` |
| Exportar | Seta para cima saindo de uma bandeja | `muted` |

---

## 5. Espaçamento e layout

### 5.1 Escala de espaçamento

Baseada em incrementos de ~2–8px, não uma escala rígida de 4/8 — os valores reais usados no protótipo:

`gap: 10px` · `pad: 12px` · `padLg: 16px` · `sectionGap: 16–18px`

### 5.2 Raio de borda

| Token | Valor | Uso |
|---|---|---|
| `sm` | 6px | Chips, pills, itens de lista, painéis internos |
| `md` | 10px | Cards, botões, code blocks |
| `lg` | 14px | Modal, elementos de destaque maior |

### 5.3 Estrutura de página ("casca de app")

- **Header fixo** no topo (nunca rola).
- **Sidebar** (280px expandida / 60px recolhida) e **conteúdo principal** ocupam o restante da altura da tela **cada um com scroll interno independente** — a página em si nunca rola. Isso evita o bug clássico de "sidebar mais alta que o conteúdo, sobra vazio do lado".
- **Scrollbar customizada e fina** (9px, trilho transparente, polegar cinza translúcido) em todos os lugares com scroll — sidebar, code blocks, drawers, modal —, nunca a barra de rolagem padrão do navegador.

### 5.4 Hierarquia de conteúdo por tela

1 card-herói (diagnóstico/resultado) → cards de apoio lado a lado → detalhe secundário em accordion fechado por padrão (timeline, validações completas). Nunca mais de 2 cards do mesmo peso lado a lado.

---

## 6. Componentes

### 6.1 Botões — 3 níveis, nunca mais que isso

| Nível | Estilo | Quando usar |
|---|---|---|
| **Primário** | Fundo `accent` sólido, texto `onAccent`, 100% da largura do container pai | 1 por tela/seção — a ação mais importante (ex: "Copiar chamado") |
| **Secundário** | Borda `border`, fundo `surfaceSoft`, texto `text` | Ação alternativa de mesmo contexto (ex: "Fechar" num drawer) |
| **Terciário** | Sem borda, sem fundo, texto `accent`, alinhado à esquerda, padding mínimo | Ação de baixo compromisso / link inline (ex: "+2 provas →", "Ver as 4 validações →") — **nunca** usar botão secundário cheio para esse tipo de ação, é peso visual demais para uma ação de "ver mais" |

### 6.2 Badges, chips e pills — 3 famílias, papéis fixos

| Família | Aparência | Papel |
|---|---|---|
| **Badge de status** | Pill preenchido (fundo `xSoft` + borda `xLine` + texto `x`), uppercase, fonte de código | Estado fixo e semântico: Falhou/Aprovado/Pulado. Cor nunca reaproveitada para outro significado. |
| **Chip de metadado** | Pill com borda neutra (`border`/`surface`), texto `muted` | Tag/contexto sem status: "@bug conhecido", "+3 tags", caminho de arquivo |
| **Chip seletor / filtro** | Pill clicável, muda de cor quando ativo (borda + fundo + texto na cor do que representa) | Navegação/filtro: chips da sidebar ("Falhas · 10", "Aprovados · 86"), toggle "Principais/Todas" da timeline |

**Regra de visibilidade:** um chip de filtro só aparece se a contagem correspondente for > 0 (exceto "Tudo", que é sempre visível). Nunca mostrar um filtro de "0 resultados".

### 6.3 Cards

Container neutro: `surface` + borda `border` + `border-radius: md` + sombra de card. Nunca borda colorida lateral para indicar severidade — o destaque vem do texto/label dentro do card (ex: micro-label vermelho "validação obrigatória não aplicada"), não da moldura.

### 6.4 Tabs

Controle segmentado (fundo `surfaceSoft`, aba ativa ganha fundo `surface` + contorno interno `borderStrong`) — **nunca sublinhado** (contraste fraco em fundo escuro). Ficam à direita do cabeçalho do teste, na mesma linha do título — não em linha própria, para não roubar espaço vertical do conteúdo. As abas se **adaptam por cenário**: teste que passou reaproveita as mesmas 3 abas (renomeando "Diagnóstico" → "Resultado"); teste pulado não mostra nenhuma aba (conteúdo único, sem necessidade de navegação).

### 6.5 Accordion — dois níveis

1. **Accordion de suíte** (sidebar): fechado por padrão sempre, independente de ter falha ou não — o botão global "Expandir tudo / Recolher tudo" e o switch "Mostrar somente falhas" cobrem o caso de acesso rápido. Suítes são separadas por uma linha divisória quase invisível (`dividerFaint`), nunca uma borda forte.
2. **Accordion de conteúdo dentro de uma suíte aberta**: falhas e pulados sempre visíveis; aprovados ficam atrás de um link terciário "+N Aprovados ↓" (nunca um texto tipo "Mostrar N que passaram" — muito casual para um relatório executivo).
3. **Accordion de timeline** (dentro do diagnóstico): fechado por padrão, chevron gira 90–180° com transição de ~150ms.

### 6.6 Code block / JSON viewer / terminal

- Header do bloco: pill de linguagem (JSON/cURL) + título descritivo + botão de copiar com ícone (nunca só texto).
- Sintaxe: chave (`info`), string/valor normal (`text`), valor divergente/erro (`error`) — tokenizado span a span, nunca destaque de linha inteira.
- Scroll vertical com altura máxima; **nunca** `overflow-wrap: anywhere` em cURL (quebra URLs e tokens no meio) — prefira scroll horizontal.
- Botão de copiar muda para "✓ Copiado" por ~1.3s como confirmação, depois volta ao texto original.

### 6.7 Esperado vs. Recebido

Sempre lado a lado (2 colunas), nunca um em cima do outro. Os dois painéis mantêm o tom neutro de card/bloco interno; quando há divergência, o erro aparece no chip de status e no token divergente (`errorSoft` só naquele trecho), não no bloco inteiro.

### 6.8 Drawer vs. Modal — regra de uso

- **Drawer** (lateral, desliza da direita): para uma **lista** de itens relacionados mantendo o contexto da tela por trás — validações completas, provas completas.
- **Modal** (central, popup): para **um único artefato** que pede foco total — JSON ampliado de esperado/recebido.
- Nunca os dois abertos ao mesmo tempo. Overlay sempre `rgba(0,0,0,.45)` em ambos os temas (scrim funciona igual em dark e light).

### 6.9 Sidebar / navegação

- Busca com ícone de lupa embutido à esquerda do input.
- Chips de filtro coloridos por status (só aparecem se count > 0).
- Switch "Mostrar somente falhas" — filtra a árvore inteira para só failed, ignorando o accordion normal.
- Suítes agrupadas por arquivo de spec, com contagem por status usando ícone SVG + número (nunca caractere Unicode solto).
- Recolhida: vira uma barra fina só com o botão de expandir — sem lista de bolinhas de status (tentativa anterior removida por ser difícil de interpretar sem rótulo).

### 6.10 Switch / Toggle

Usado para o "Mostrar somente falhas" da sidebar. Trilho (`track`) de 30×17px, borda e fundo neutros quando desligado; quando ligado, trilho ganha `errorSoft`/`errorLine` (porque este toggle é especificamente sobre falhas) e o "polegar" (`thumb`, 11×11px, círculo) se move de `left: 2px` para `left: 16px` com transição de posição de 150ms. Um switch genérico de outro contexto (ex.: tema) usaria `accent` em vez de `error` como cor de "ligado".

### 6.11 Toast de confirmação

Posição fixa no canto inferior direito da tela. Fundo `successSoft`, borda `successLine`, texto `success` — reservado para confirmações de ação ("Chamado copiado", "Script copiado"), nunca para erros (um toast de erro, se existir no futuro, deveria usar os tokens de `error`). Aparece com fade + `translateY` de 8px→0 em ~150ms, permanece ~1.3–1.4s, some com a mesma transição invertida. Nunca empilhar dois toasts — o novo substitui o anterior.

### 6.12 Barra de duração relativa

Usada na timeline de chamadas: trilho neutro (`trackFaint`) de 4px de altura, barra interna colorida (`accent` para chamada normal, `error` para a chamada que falhou) com largura proporcional ao tempo relativo daquela chamada frente às demais — não mostra o valor em ms na barra em si (isso fica no texto ao lado), é só um indicador visual rápido de "essa chamada demorou mais/menos que as outras".

### 6.13 Chip de metadado minúsculo (`metaChipTiny`)

Variante ainda mais compacta do chip de metadado (seção 6.2), usada só dentro da timeline para as tags de cada chamada ("preparação", "gera $TOKEN", "não executada"): fonte de código, 8.5px, sem padding vertical quase nenhum. Não é clicável, é só contexto.

### 6.14 Busca e filtro da sidebar

- Input com ícone de lupa embutido à esquerda (posição absoluta, `pointer-events: none`) e botão "×" de limpar que só aparece quando há texto digitado (posição absoluta à direita).
- Ao digitar, o filtro é **ao vivo**: cada suíte é reavaliada a cada tecla — se nenhum teste (nem o nome da suíte) bate com a busca, a suíte inteira some da lista; se bate, a suíte força abertura automática (ignorando o estado manual de aberto/fechado) e mostra **apenas** os testes que casam com o termo, ignorando temporariamente a regra normal de "aprovados ficam escondidos".
- Limpar a busca (via × ou apagar o texto) devolve a árvore ao estado manual anterior (suítes que o usuário tinha aberto/fechado continuam como estavam).

### 6.15 Sidebar — dimensões e comportamento de recolher

Expandida: 280px. Recolhida: 60px (só o botão de expandir, sem lista). Transição de largura: `grid-template-columns` animado em 180ms ease-out. O conteúdo principal ocupa o restante via `1fr`, então nunca precisa de cálculo manual de largura.

### 6.16 Overview strip

3 cards neutros lado a lado (Esperado / Recebido / Tempo do teste), sempre visíveis acima das abas, resumindo o essencial do teste sem precisar abrir nada. Escondido no cenário de teste pulado (não há "esperado/recebido/tempo" pra mostrar).

---

## 7. Estados

| Estado | Tratamento |
|---|---|
| **Hover** (item de lista, botão) | Levíssima mudança de fundo/borda para `accentLine`/`accentSoft` — nunca mudança de cor de texto brusca |
| **Ativo/selecionado** (item de sidebar, tab, chip de filtro) | Barra de acento de 3px à esquerda (cor do status) + fundo `surface` para itens de lista; fundo `surface` + contorno interno para tabs; fundo + borda coloridos para chips |
| **Desabilitado** | Opacidade ~55%, `cursor: not-allowed`, sem hover |
| **Foco (teclado)** | Contorno visível na cor `accentLine` — obrigatório em tabs e qualquer elemento clicável |
| **Copiado (feedback de cópia)** | Texto do botão muda para "✓ Copiado" por ~1.3s via toast + label temporário |

---

## 8. Motion / microinterações

- **Duração:** 120–200ms para tudo (hover, chip, tab, accordion). 150–180ms para entrada/saída de overlay (drawer, modal, toast).
- **Easing:** `ease-out` como padrão.
- **O que anima:** troca de tab (crossfade — porém ver nota abaixo), abrir/fechar accordion (altura + opacidade), chevron (rotação), drawer (translateX), modal (fade), toast (translateY + fade).
- **O que NUNCA anima:** texto de código/JSON/log/cURL — atrapalha leitura e cópia.
- **`prefers-reduced-motion`:** todo `animation-duration`/`transition-duration` cai para ~0 via media query global.
- ⚠️ **Nota técnica:** evite basear visibilidade de conteúdo (troca de abas, painéis condicionais) em `opacity`/`max-height` combinados com objetos de estilo recriados a cada render — isso causou uma dessincronia real entre o atributo de estilo e o valor computado no navegador (conteúdo ficava invisível mesmo com `opacity: 1` no atributo). A solução robusta adotada foi **`display: block/none` direto**, sem transição, para troca de conteúdo por abas. Reserve transições de opacidade para elementos que não escondem/mostram conteúdo estrutural (toasts, overlays).

---

## 9. Terminologia (glossário oficial — só português, um registro só)

Regra geral: **toda label/badge/tag curta usa maiúscula inicial** (Sentence case). Frases completas (corpo de texto, descrições) seguem pontuação normal de português.

| Conceito | Badge/tag (Maiúscula inicial) | Contagem/plural | Nunca usar |
|---|---|---|---|
| Falha | **Falhou** | Falhas | ~~failed~~, ~~fail~~ |
| Sucesso | **Aprovado** | Aprovados | ~~passed~~, ~~passou~~, ~~pass~~ |
| Pulado | **Pulado** | Pulados | ~~skip~~, ~~skipped~~ |

Outros rótulos padronizados:
- Link de expandir aprovados: **"+N Aprovados ↓"** / **"Ocultar Aprovados ↑"** (nunca "Mostrar N que passaram" — tom casual demais para relatório executivo).
- Métricas do cabeçalho: **Total · Aprovados · Falhas · Pulados · Sucesso (%)**.
- Status badge de teste individual: frases descritivas com maiúscula inicial — "Falha contratual", "Contrato cumprido", "Não executado".
- Elementos que são literalmente código/caminho de arquivo (`produtos.cy.ts:152:27`, `test.skip`, métodos HTTP como `GET`/`POST`) **não seguem** a regra de capitalização — são valores literais, não rótulos de prosa.
- Siglas (API, HTTP, JSON, ID) sempre maiúsculas.

---

## 10. Cenários de teste (fail / pass / skip)

O relatório precisa cobrir os 3 resultados possíveis de um teste, com a **mesma estrutura visual**, só variando cor/texto:

| | Falhou | Aprovado | Pulado |
|---|---|---|---|
| Abas | 3 (Diagnóstico/Reprodução/Chamado) | 3 (Resultado/Reprodução/Chamado) | Nenhuma — card único |
| Overview strip | Sim (esperado ≠ recebido) | Sim (esperado = recebido) | Oculto |
| Card-herói | Micro-label vermelha + narrativa da falha | Micro-label verde + narrativa de sucesso | — |
| Esperado vs Recebido | Painéis divergentes, campo destacado | Painéis idênticos, sem destaque | — |
| Aba Chamado | Ticket completo (contexto/cenário/resultado) + ações de cópia | Nota simples "nenhuma ação necessária", sem botão de ação (evita ação inútil) | — |
| Card único (skip) | — | — | Micro-label neutra + motivo do skip + local no código + botão "copiar motivo" |

---

## 11. Decisões de sistema — por que essa direção (não outra)

Durante a exploração, testamos alternativas lado a lado antes de fixar cada decisão. Registrado aqui para não se perder:

| Dimensão | Opções consideradas | Escolhida | Por quê |
|---|---|---|---|
| Densidade visual | Compacta / Confortável / Espaçada | **Confortável** | Reduz a sensação de "parede de caixas" do protótipo original sem virar um app consumer com respiro exagerado |
| Raio de borda | Reto / Médio / Arredondado | **Médio** (6–14px) | Reto demais lembra formulário corporativo antigo; arredondado demais foge do tom técnico |
| Intensidade de borda/sombra | Flat / Sutil / Elevado | **Sutil** | Sombra flat parece "sem profundidade nenhuma"; elevado demais compete com o conteúdo |
| Destaque da falha | Discreto / Médio / Forte | **Discreto→Médio** (evoluiu para mais discreto ao longo das iterações) | Começou com borda vermelha forte + glow; o usuário pediu para reduzir — hoje é só a micro-label + estrutura neutra |
| Estilo de ícone | Outline / Preenchido / Duotone | **Outline** | Consistente com o peso tipográfico leve de Inter; preenchido/duotone pesam demais ao lado de tanto texto |
| Paleta de cor | Tech Night / Midnight Pro / Signal High-Contrast / Graphite Slate / Clean Light | **Midnight Pro** (dark) / **Clean Light** (light) | Acento azul-petróleo transmite "confiança/precisão" melhor que o violeta genérico de SaaS, e libera o violeta original (não usado) para não conflitar com nenhum status |
| Fontes | Inter+JetBrains Mono / IBM Plex Sans+Mono / Manrope | **Inter + JetBrains Mono** | Inter é o padrão de devtools mais neutro e testado (Linear, Vercel); JetBrains Mono tem a melhor distinção 0/O e 1/l/I para IDs e hashes |

## 12. Limitações conhecidas / fora de escopo

Itens identificados mas conscientemente não resolvidos nesta fase — não são bugs, são decisões de escopo em aberto:

- **Estado vazio de busca:** se a busca não bate com nenhum teste em nenhuma suíte, a sidebar fica em branco, sem mensagem "nenhum resultado encontrado". Ainda não desenhado.
- **Conteúdo completo só em 3 cenários:** dos ~99 testes do mock, apenas 3 (falhou / aprovado / pulado) têm conteúdo de diagnóstico totalmente customizado. Qualquer outro teste reaproveita o layout do cenário "falhou" com um toast de aviso ("prévia"). Em produção, isso deve ser substituído por geração de conteúdo real por teste, não por variações de HTML fixo.
- **Tags "@bug conhecido" / "+N tags":** existem visualmente mas não são clicáveis — indefinido se deveriam abrir um link para o bug conhecido ou uma lista completa de tags.
- **Preview do texto copiado:** os botões "Copiar chamado" / "Copiar evidências" copiam às cegas, só um toast confirma — sem preview do texto exato que será colado.
- **Acessibilidade por teclado:** não foi feita uma auditoria completa de navegação só por Tab / estados de foco em todos os elementos clicáveis.
- **Responsividade:** o sistema foi desenhado para desktop (sidebar fixa + conteúdo); comportamento em telas menores (tablet/mobile) não foi definido.

---

## 13. Anti-padrões (evitar)

- Borda vermelha forte / glow ao redor do card de diagnóstico — troca por micro-label colorida + estrutura neutra.
- Misturar inglês e português no mesmo relatório.
- Dois botões lado a lado para "Expandir tudo"/"Recolher tudo" — vira um único link que alterna de acordo com o estado atual.
- Painel fixo de "Falhas" no topo da sidebar duplicando as suítes — removido a favor do switch "Mostrar somente falhas".
- Símbolos de status como caractere Unicode solto sem controle de fonte — sempre SVG.
- Botão de ação sem utilidade prática (ex: "Copiar confirmação de sucesso" num teste que passou) — se a ação não tem valor real, não existe.
- Chip de filtro para uma categoria com zero resultados.
- Animação de opacidade/max-height combinada com objetos de estilo recriados a cada render para controlar visibilidade de conteúdo estrutural — ver nota na seção 8.
