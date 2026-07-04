# Template de Chamado de API

Use este template somente depois que o usuario selecionar explicitamente um ou mais problemas
numerados da analise inicial. Use apenas para defeitos provaveis ou confirmados no backend.

Antes de entregar, remova tokens, cookies, senhas, credenciais e headers sem relevancia para
reproducao.

Agrupe no mesmo chamado testes que demonstrem a mesma causa e o mesmo comportamento incorreto.
Crie chamados separados quando a causa, o comportamento ou a correcao esperada forem diferentes.

---

## Template

```text
TITULO:
<Descricao curta e objetiva do problema>

CENARIO:

DADO que <contexto e pre-condicao>
E <dados relevantes enviados ou estado necessario>
QUANDO <requisicao executada>
ENTAO <comportamento esperado>
POREM <comportamento atual incorreto>

RESULTADO ATUAL:
<Descreva objetivamente o status e a resposta recebidos.>

RESULTADO ESPERADO:
<Descreva o comportamento esperado e sua fundamentacao no contrato, padrao ou backend.>

EVIDENCIAS PARA REPRODUCAO:

Metodo: <GET|POST|PUT|DELETE|PATCH>
URL: <URL sem credenciais>
Headers relevantes:
<Somente headers necessarios; nunca incluir Authorization, Cookie ou credenciais>

Body:
<Body completo utilizado ou null>

ANALISE TECNICA:
<Explique o que foi confirmado no teste e no backend. Diferencie evidencia de hipotese.>

IMPACTO:
<Explique o impacto funcional, de seguranca, contrato ou manutencao.>
```

---

## Regras para o titulo

- Seja curto, pesquisavel e focado no comportamento.
- Inclua API/recurso.
- Nao inclua nomes de testes, IDs aleatorios ou detalhes de massa.
- Nao afirme causa tecnica nao confirmada.

Exemplos:

```text
[API][Visualizacao Filtro] Resposta de validacao expoe detalhes internos do backend
[API][Visualizacao Filtro] Criacao com valores nulos retorna HTTP 500
[API][Empresa] Consulta sem permissao retorna dados protegidos
```

---

## Exemplo preenchido

```text
TITULO:
[API][Visualizacao Filtro] Resposta sem body expoe detalhes internos do backend

CENARIO:

DADO que envio uma requisicao de criacao de visualizacao de filtro
E nao envio o body obrigatorio
QUANDO executo POST /visualizacao_filtro/
ENTAO a API deve retornar um erro de validacao padronizado
POREM a mensagem retornada expoe pacote, classe e assinatura interna do backend

RESULTADO ATUAL:
A API retorna HTTP 400 com uma mensagem contendo `br.com.zitrus...BaseController.save(REQ)`.

RESULTADO ESPERADO:
A API deve retornar HTTP 400 com mensagem segura e padronizada, sem detalhes internos de
implementacao.

EVIDENCIAS PARA REPRODUCAO:

Metodo: POST
URL: https://backend.exemplo/visualizacao_filtro/
Headers relevantes:
Content-Type: application/json

Body:
null

ANALISE TECNICA:
O status de validacao esta correto, mas o teste falhou porque a response expos detalhes internos.
A validacao Cypress esta coerente com o padrao de nao-vazamento do projeto.

IMPACTO:
Exposicao de detalhes internos facilita reconhecimento da implementacao e quebra o contrato de erro
padronizado da API.
```
