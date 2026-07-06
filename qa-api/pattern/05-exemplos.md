# Exemplos de aplicação das regras

Parte do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`. As regras que estes exemplos ilustram estão em
`01-oraculo-selecao.md` (oráculo, catálogo, técnicas e processo de decisão) e
`02-validacao-camadas.md` (validação por camadas).

Estes exemplos orientam decisões durante a descoberta e o planejamento. Eles não substituem o
contrato real do produto e não devem ser copiados como regras universais.

---

## Exemplo 1 — Oráculo funcional completo

**Contrato encontrado:** `POST /empresas` retorna `201`, gera um `id` e permite consultar a empresa
por `GET /empresas/{id}`.

**Cenário selecionado:** criar empresa com dados válidos.

**Oráculo e evidências:**

- o `POST` retorna exatamente `201`;
- a resposta segue o schema de empresa;
- os dados retornados refletem o payload enviado;
- o `GET` pelo novo `id` retorna os mesmos dados persistidos.

**Decisão:** `Aplicavel`. O status vem do contrato e a persistência pode ser confirmada por leitura.

## Exemplo 2 — Robustez sem regra funcional definida

**Contrato encontrado:** existe um `POST`, mas não há regra documentada para envio repetido do mesmo
payload. O backend possui restrição única no banco.

**Cenário selecionado:** repetir o `POST` por existir risco de erro de banco exposto.

**Oráculo aceitável:**

- não expõe SQL, stack trace, package, classe ou framework;
- não produz persistência parcial ou estado inconsistente;
- retorna uma resposta tratada pelo produto.

**Não exigir:** `400`, `409` ou mensagem específica sem evidência contratual.

**Decisão:** `Aplicavel` como robustez, com o risco registrado na matriz.

## Exemplo 3 — Cenário sem oráculo confiável

**Ideia encontrada:** atualizar um registro com estado `ENCERRADO`.

**Lacuna:** nenhuma fonte informa se a atualização deve ser permitida ou bloqueada.

**Decisão:** `Nao confirmado`. Registrar a dúvida e não criar automaticamente um teste que aceite ou
rejeite a operação por suposição.

## Exemplo 4 — Particionamento sem testes redundantes

**Contrato encontrado:** `nome` é obrigatório, não aceita `null` e precisa possuir pelo menos um
caractere visível.

| Entrada              | Partição representada           | Decisão                                             |
| -------------------- | ------------------------------- | --------------------------------------------------- |
| campo `nome` ausente | propriedade obrigatória ausente | criar                                               |
| `nome: null`         | tipo/nulabilidade inválida      | criar                                               |
| `nome: ""`           | texto sem caractere visível     | criar                                               |
| `nome: "   "`        | mesma regra de texto vazio      | criar apenas se houver tratamento ou risco distinto |
| `nome: []` e `{}`    | tipo inválido equivalente       | escolher um representante, salvo risco distinto     |

**Decisão:** cobrir partições diferentes; não criar variações que exercitam exatamente a mesma regra
e o mesmo tratamento.

## Exemplo 5 — Análise de valor limite

**Contrato encontrado:** o campo `descricao` aceita de 1 a 100 caracteres.

**Cenários selecionados:**

- `0` caracteres: primeiro valor inválido abaixo do limite;
- `1` caractere: menor limite válido;
- `100` caracteres: maior limite válido;
- `101` caracteres: primeiro valor inválido acima do limite.

**Não criar automaticamente:** testes com `50`, `99`, `102` e `500` caracteres, pois não acrescentam
uma partição ou risco diferente.

## Exemplo 6 — Tabela de decisão para combinações reais

**Regra encontrada:** uma exclusão é permitida somente quando o registro está inativo e não possui
vínculos.

| Ativo | Possui vínculo | Resultado contratual | Decisão                                                 |
| ----- | -------------- | -------------------- | ------------------------------------------------------- |
| não   | não            | excluir              | criar                                                   |
| sim   | não            | bloquear             | criar                                                   |
| não   | sim            | bloquear             | criar                                                   |
| sim   | sim            | bloquear             | criar somente se houver comportamento ou risco distinto |

**Decisão:** cobrir resultados e combinações relevantes sem transformar toda combinação possível em
teste obrigatório.

## Exemplo 7 — Checklist incorporada ao cenário

**Cenário:** atualizar empresa com dados válidos.

O mesmo teste deve validar:

- status e schema da resposta;
- valores atualizados e campos imutáveis;
- persistência por um novo `GET`;
- ausência de detalhe interno inesperado;
- cleanup ou restauração dos dados.

**Não criar:** um teste para status, outro para schema e outro apenas para persistência da mesma
atualização.

## Exemplo 8 — Seleção de robustez por risco

| Possível cenário                           | Evidência ou risco encontrado                               | Decisão                                   |
| ------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------- |
| enviar `clienteId` inexistente             | backend consulta relacionamento diretamente no banco        | criar                                     |
| enviar campo `id` controlado pelo servidor | payload aceita propriedades extras                          | criar                                     |
| repetir `DELETE`                           | histórico de erro interno em recurso já removido            | criar                                     |
| concorrência em atualização                | nenhuma evidência, regra ou impacto específico identificado | não criar; registrar como `Nao aplicavel` |
| carga com milhares de requisições          | objetivo da suíte é funcional e não há requisito de carga   | não criar nesta suíte                     |

**Decisão:** robustez não é uma lista fixa. Cada cenário escolhido precisa de risco, evidência ou
impacto claro.

## Exemplo 9 — Registro na matriz de cenários

| Tipo de teste                         | Técnica                       | Cenário                        | Situação         | Risco/Justificativa                      | Oráculo/Evidência                                   |
| ------------------------------------- | ----------------------------- | ------------------------------ | ---------------- | ---------------------------------------- | --------------------------------------------------- |
| Fluxo principal válido                | Teste baseado em cenário      | criar empresa válida           | `Aplicavel`      | operação principal                       | contrato `201`, schema e `GET` confirmando os dados |
| Valores limite                        | Análise de valor limite       | descrição com 101 caracteres   | `Aplicavel`      | primeiro valor inválido acima do limite  | validação `maxLength: 100` do backend               |
| Repetição, duplicidade e idempotência | Suposição de erro             | repetir `POST`                 | `Aplicavel`      | restrição única pode expor erro de banco | resposta controlada e estado consistente            |
| Regra de negócio de entrada           | Transição de estado           | atualizar registro `ENCERRADO` | `Nao confirmado` | regra não encontrada                     | perguntar se a atualização deve ser bloqueada       |
| Concorrência                          | Teste baseado em concorrência | atualizar simultaneamente      | `Nao aplicavel`  | nenhum risco ou requisito identificado   | não criar nesta suíte                               |

**Decisão:** a matriz deve permitir entender por que cada teste será criado, descartado ou deixado
para confirmação. Cenário sem justificativa e oráculo não deve seguir para implementação.

Tipos como contrato da resposta, persistência e não-vazamento podem aparecer como checklist
incorporada em um cenário, sem gerar linhas ou testes separados. O `api-criador.md` mantém uma
tabela própria de cobertura do catálogo para garantir que nenhum tipo seja esquecido.
