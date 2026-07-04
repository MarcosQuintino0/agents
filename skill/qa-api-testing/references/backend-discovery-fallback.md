# Backend Discovery Fallback

Use this reference only when Graphify is unavailable, failed, stale, or explicitly out of scope.

This is a fallback GPS, not a contract source. It can point to controllers, DTOs, services, repositories, entities, security code, and error handlers. It must not extract final payloads, messages, status codes, limits, or business rules as truth. Confirm details in backend code, OpenAPI, approved documentation, or real responses.

The content below is the migrated legacy `api-mapeador.md` with its original intent preserved.

---

# Agente: Mapeador de APIs do Backend

Gera um **índice de ponteiros** (NÃO um contrato extraído) das APIs REST encontradas no backend, para
acelerar a descoberta do `api-criador.md`. Independente de stack (Java, .NET, Node, Python) e das
práticas do time — o agente é semântico, não depende de anotações específicas.

## Objetivo

Depois deste mapeamento, o `api-criador.md` deve conseguir localizar os arquivos de cada API
sem precisar caçar a estrutura do backend do zero a cada invocação.

Fluxo esperado:

```text
1. Rode este mapeador uma vez (ou quando o backend mudar significativamente).
2. Gera `.ai/agents/mapeamento/mapeamento-api.md` (índice de ponteiros).
3. Depois use o `api-criador.md`, que consulta o índice antes de caçar endpoints.
```

O mapeador pode ser chamado isoladamente (para atualizar o índice) ou como parte do
`api-preparador.md` na primeira vez que um projeto é preparado.

---

## Regra principal: ponteiros, não contratos

O mapeamento é um **GPS**, não um espelho. Ele diz **ONDE** encontrar cada coisa no backend, mas
**NÃO extrai** o conteúdo. A razão: detalhes (payloads, mensagens, regras) mudam com frequência e um
índice defasado é pior que inexistente — gera confiança falsa.

O que ENTRA no mapeamento (ponteiros estáveis):
- caminhos relativos dos arquivos (Controller, Request DTO, Response DTO, Service, Repository)
- lista de endpoints (método + path + verbo da ação)
- base path da API
- sinais de infraestrutura (tem paginação, usa Bean Validation, handler global de erro)

O que NÃO ENTRA (lê do código real na hora de criar o teste):
- payloads completos (`{descricao: string, max 50}`)
- mensagens de erro exatas
- status codes esperados
- regras de negócio detalhadas

---

## Fronteira: caminhos relativos, nunca absolutos

**NUNCA** use caminhos absolutos (`C:\...\AlegacaoAnsController.java`) — eles quebram na máquina de
outro desenvolvedor. Use sempre caminhos **relativos ao root do backend** informado pelo usuário:

- ✅ `src/main/java/.../AlegacaoAnsController.java`
- ❌ `C:\projetos\backend\src\main\java\...`

O usuário informa o root do backend ao invocar o mapeador (ex.: `mapeie o backend em
C:/projetos/ressus-backend`). O mapeador registra esse root apenas no cabeçalho do `.md` (para
referência), mas os ponteiros são todos relativos.

---

## Como descobrir as APIs (adaptativo, multi-stack)

O mapeador é **adaptativo** — não assume uma stack específica nem boas práticas rígidas. Procure por
indicadores de endpoints REST em qualquer linguagem:

### Sinais de controllers/recursos
- Classes/arquivos com `Controller`, `Resource`, `Handler`, `Router` no nome
- Anotações/marcadores de rota (variam por stack):
  - Java/Spring: `@RestController`, `@RequestMapping`, `@GetMapping`
  - .NET: `[ApiController]`, `[Route]`, `[HttpGet]`
  - Node/Express: `app.get(`, `router.post(`, `express()`
  - Python/FastAPI: `@app.get(`, `@router.post(`, `APIRouter`
  - Node/NestJS: `@Controller()`, `@Get()`, `@Post()`
- Se a stack não for óbvia, inferia pela estrutura de pastas e extensões (`.java`, `.cs`, `.js`,
  `.ts`, `.py`)

### Sinais de DTOs/Models
- Classes com `Request`, `Response`, `Dto`, `Model`, `ViewModel`, `Payload` no nome
- Frequentemente na mesma pasta do controller ou em `dto/`, `models/`, `domain/`

### Sinais de infraestrutura
- Paginação: `Pageable`, `Page<T>`, `take/skip`, `limit/offset`, `IPagination`
- Validação: `@Valid`, `@NotNull`, `[Required]`, `validate()`, `joi.object`, `pydantic`
- Tratamento de erro: `@ExceptionHandler`, `@ControllerAdvice`, middleware `ErrorHandler`, `try/catch`
  global

### Incertezas
Se não conseguir determinar algo (base path ambíguo, stack não reconhecida, endpoint órfão),
**documente a incerteza** no mapeamento em vez de adivinhar:

```text
- Base path: INDEFINIDO (não há @RequestMapping na classe — verifique manualmente)
```

---

## O que extrair para cada API

Para cada API REST encontrada, registre:

1. **Nome da API** (derivado do base path ou do controller)
2. **Base path** (ex.: `/alegacao_ans`)
3. **Controller principal** (caminho relativo)
4. **Endpoints** (lista: método HTTP + path + nome da ação interna)
5. **Request DTO** (caminho relativo, se existir)
6. **Response DTO** (caminho relativo, se existir)
7. **Service/Repository** (caminho relativo, se existir — onde moram as regras)
8. **Validações** (ONDE estão — não O QUÊ validam. Ex.: "dentro do Request DTO, anotações @Size")
9. **Tratamento de erro** (caminho do handler global, se houver)
10. **Sinais de infraestrutura** (paginação? validação ativa? handler global?)

---

## Regras inegociáveis

- **Read-only no backend**: nunca crie, altere ou remova arquivos do projeto do backend.
- **Ponteiros relativos**: nunca caminhos absolutos (`C:\...`).
- **Não extraia contratos**: não copie payloads, mensagens ou regras para o mapeamento.
- **Não gere IDs de regra** (`@contrato`/`@regra <id>`): o mapeador fornece matéria-prima factual
  (onde estão endpoints, DTOs, validações, exceptions). A criação de IDs estáveis e do contrato JSDoc
  estruturado é responsabilidade do `api-criador.md` (ver `pattern/04-comentarios-jsdoc.md`). Se o
  backend já expõe um identificador natural (código de erro, nome de constraint), registre-o como
  ponteiro/incerteza — sem inventar o id que o teste usará.
- Ao encontrar código de erro, nome de constraint ou enum que possa servir de identificador natural,
  registre apenas o arquivo onde ele pode ser confirmado. Não copie o valor para o índice nem o trate
  como ID final, status ou mensagem contratual.
- **Não invente endpoints**: se não encontrou, não crie.
- **Documente incertezas**: melhor marcar "indefinido" do que adivinhar.
- **Caminhos estáveis**: se um arquivo mudou de lugar desde o último mapeamento, atualize o ponteiro.

---

## Saída obrigatória

Gere `.ai/agents/mapeamento/mapeamento-api.md` com exatamente esta estrutura:

```text
# Mapeamento de APIs do backend

Gerado em: <data ISO>
Backend root: <caminho informado pelo usuário>
Stack inferida: <Java/Spring | .NET | Node/Express | Python | indefinida>

## Índice rápido

- <nome-api>: <métodos> <base path>, <sinais de infraestrutura>
- <nome-api>: ...

## <nome-api>

- Controller: <caminho relativo>
- Base path: <rota>
- Endpoints:
  - <MÉTODO> <path>  → <ação interna>
  - ...
- Request DTO: <caminho relativo ou "não identificado">
- Response DTO: <caminho relativo ou "não identificado">
- Service: <caminho relativo ou "não identificado">
- Validações: <onde estão>
- Tratamento de erro: <caminho do handler ou "não identificado">
- Infraestrutura: <paginação? validação ativa? handler global?>

## <próxima-api>
...
```

O cabeçalho com data e stack permite que o `api-criador.md` avalie se o mapeamento está fresco e
confiável antes de confiar nos ponteiros.

---

## Quando re-rodar

- Quando o backend mudar significativamente (novos endpoints, reestruturação de pastas)
- Pode ser chamado isoladamente (sem re-rodar o `api-preparador.md`)
- O `api-preparador.md` pode chamá-lo automaticamente na primeira preparação de um projeto

---

## Prompt recomendado

```text
Mapeie todas as APIs REST do backend em C:/caminho/do/backend seguindo
.ai/agents/api-mapeador.md.

Gere o índice em .ai/agents/mapeamento/mapeamento-api.md.
Não altere nenhum arquivo do backend — apenas leitura.
```
