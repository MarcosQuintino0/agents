# Oraculos Do Fuzz

Fuzzing tem dois tipos de oraculo.

## Universais

Sempre podem ser verificados:

- API nao deve retornar 5xx para entrada controlavel pelo cliente.
- Resposta nao deve vazar stack trace, SQL, pacote, classe interna ou exception bruta.
- Corpo de resposta deve ter content-type coerente.
- Resposta deve bater com schema conhecido quando houver schema.
- Operacao rejeitada nao deve persistir parcialmente, quando houver forma segura de consultar.
- Operacao sem auth/token invalido nao deve alterar estado.

Esses checks geram findings de robustez/seguranca.

## Contratuais

So podem ser exigidos quando `confidence=confirmed`:

- status exato;
- mensagem exata;
- campo obrigatorio;
- tipo;
- formato;
- enum;
- limite;
- regra de negocio;
- permissao;
- transicao de estado.

Se a confidence for `observed` ou `inferred`, o fuzz pode testar, mas o resultado deve sair como suspeita ou lacuna, nao como bug funcional.

## Severidade

- `critical`: 5xx, vazamento interno, crash, corrupcao observada, alteracao indevida em auth negativa.
- `high`: payload fora de contrato confirmado aceito, baseline valido rejeitado, mass assignment confirmado.
- `medium`: status estranho mas controlado, schema simples divergente, content-type incoerente em erro.
- `low`: ruido, inconsistencia de report, profile incompleto.

## Promocao Para Cypress

Promova para teste oficial somente quando:

1. o achado e reproduzivel por replay;
2. o oraculo e confirmado;
3. a massa e cleanup estao seguros;
4. o teste representa uma regra ou risco relevante, nao apenas um valor aleatorio.

Se faltar oraculo, registre como `Nao confirmado` para a `qa-api`.
