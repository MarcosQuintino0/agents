# Padrão mínimo de validação (validação por camadas)

Parte do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`.

Um teste de API **não** termina em "respondeu 200?". Para cada resposta validamos **camadas**.
Esta é a regra mais importante deste padrão.

## Numa resposta de SUCESSO

| #   | Camada                | O que checar                                                                                                                                    |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Status**            | é o código certo (200, 201, 204…)                                                                                                               |
| 2   | **Formato/contrato**  | campos existem, **tipos** certos, **enums** válidos, nulabilidade correta, e **não vem campo a mais** (schema com `additionalProperties:false`) |
| 3   | **Regra de negócio**  | os **valores refletem o que foi enviado**; `id` se mantém no update; o filtro/lista devolve o que deveria                                       |
| 4   | **Persistência real** | executar consulta de persistência após gravar e confirmar que **persistiu** (quando aplicável)                                                  |

## Numa resposta de ERRO

| #   | Camada                        | O que checar                                                                                            |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Status**                    | o status definido pelo contrato; em robustez sem contrato, apenas comportamento controlado              |
| 2   | **Shape do envelope**         | o formato esperado quando existir contrato de erro aplicável                                            |
| 3   | **Mensagem**                  | a mensagem esperada, preferencialmente exata, quando definida                                           |
| 4   | **Não-vazamento (segurança)** | o corpo **não** expõe stack trace, pacote, classe, SQL ou estrutura interna do framework                |
| 5   | **Acesso**                    | em cenários de segurança, exige autenticação e nega usuários sem permissão quando esse controle existir |

> Se um teste só checa status, ele está **incompleto**. Incorpore todas as camadas aplicáveis ao
> cenário sem inventar contrato ausente.

## Respostas relevantes

Toda resposta usada para decidir se o teste passou ou falhou deve ter o status HTTP esperado
validado explicitamente. Isso inclui:

- a resposta da operação principal;
- a consulta usada para confirmar persistência;
- a consulta usada para confirmar ausência;
- a consulta usada para provar que uma operação rejeitada não alterou ou removeu dados.

Um helper que valida somente o body ou o schema não substitui a validação do status. Chamadas
exclusivamente técnicas de setup ou cleanup podem ter tratamento próprio, desde que não sejam parte
do oráculo do cenário.
