# Template de Chamado de API

Use este template somente depois que o usuário selecionar explicitamente um ou mais problemas numerados da análise inicial.

Use apenas para defeitos prováveis ou confirmados no backend, contrato, segurança, não-vazamento ou comportamento de API.

Antes de entregar, remova tokens, cookies, senhas, credenciais e headers sem relevância para reprodução.

Agrupe no mesmo chamado testes que demonstrem a mesma causa e o mesmo comportamento incorreto. Crie chamados separados quando a causa, o comportamento ou a correção esperada forem diferentes.

## Template

```text
TITULO:
<Descrição curta e objetiva do problema>

CENARIO:

DADO que <contexto e pré-condição>
E <dados relevantes enviados ou estado necessário>
QUANDO <requisição executada>
ENTAO <comportamento esperado>
POREM <comportamento atual incorreto>

RESULTADO ATUAL:
<Descreva objetivamente o status e a resposta recebidos.>

RESULTADO ESPERADO:
<Descreva o comportamento esperado e sua fundamentação no contrato, padrão ou backend.>

EVIDENCIAS PARA REPRODUCAO:

Método: <GET|POST|PUT|DELETE|PATCH>
URL: <URL sem credenciais>
Headers relevantes:
<Somente headers necessários; nunca incluir Authorization, Cookie ou credenciais>

Body:
<Body completo utilizado ou null>

ANALISE TECNICA:
<Explique o que foi confirmado no teste e no backend. Diferencie evidência de hipótese.>

IMPACTO:
<Explique o impacto funcional, de segurança, contrato ou manutenção.>
```

## Regras para o título

- Seja curto, pesquisável e focado no comportamento.
- Inclua API/recurso.
- Não inclua nomes de testes, IDs aleatórios ou detalhes de massa.
- Não afirme causa técnica não confirmada.

Exemplos:

```text
[API][Visualização Filtro] Resposta de validação expõe detalhes internos do backend
[API][Visualização Filtro] Criação com valores nulos retorna HTTP 500
[API][Empresa] Consulta sem permissão retorna dados protegidos
```

## Exemplo preenchido

```text
TITULO:
[API][Visualização Filtro] Resposta sem body expõe detalhes internos do backend

CENARIO:

DADO que envio uma requisição de criação de visualização de filtro
E não envio o body obrigatório
QUANDO executo POST /visualizacao_filtro/
ENTAO a API deve retornar um erro de validação padronizado
POREM a mensagem retornada expõe pacote, classe e assinatura interna do backend

RESULTADO ATUAL:
A API retorna HTTP 400 com uma mensagem contendo `br.com.zitrus...BaseController.save(REQ)`.

RESULTADO ESPERADO:
A API deve retornar HTTP 400 com mensagem segura e padronizada, sem detalhes internos de implementação.

EVIDENCIAS PARA REPRODUCAO:

Método: POST
URL: https://backend.exemplo/visualizacao_filtro/
Headers relevantes:
Content-Type: application/json

Body:
null

ANALISE TECNICA:
O status de validação está correto, mas o teste falhou porque a response expôs detalhes internos.
A validação Cypress está coerente com o padrão de não-vazamento do projeto.

IMPACTO:
Exposição de detalhes internos facilita reconhecimento da implementação e quebra o contrato de erro padronizado da API.
```
