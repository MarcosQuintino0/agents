# qa-api-fuzz

`qa-api-fuzz` faz fuzzing investigativo de APIs. Ela complementa a suite oficial, mas nao substitui os testes Cypress criados pela `qa-api`.

## Objetivo

Explorar robustez, contratos e riscos como 5xx, vazamento interno, mass assignment, payloads extremos, campos inesperados, content-type incoerente e divergencias de schema.

## Quando usar

- Depois de existir um contrato OpenAPI/Swagger.
- Depois de existir suite `qa-api` com metadata suficiente.
- Quando quiser investigar robustez alem dos cenarios oficiais.
- Quando precisar reproduzir achados de fuzz.

## Quando nao usar

- Para criar suite oficial sem oraculo confirmado.
- Para rodar fuzz profundo em ambiente compartilhado sem cleanup.
- Para transformar suspeita em bug funcional sem evidencia.

## Fluxo

1. Gerar profile.
2. Rodar lint do profile.
3. Rodar smoke.
4. Usar `--dry-run` para inspecionar requests.
5. Rodar deep/stateful apenas quando ambiente, auth, massa e cleanup estiverem seguros.
6. Reproduzir achados com replay.

## Comandos

```bash
npm run qa:fuzz:profile -- --api <nome-da-api> --base-url http://localhost:3100
npm run qa:fuzz:lint -- --api <nome-da-api>
npm run qa:fuzz -- --api <nome-da-api> --mode smoke
npm run qa:fuzz -- --api <nome-da-api> --dry-run --max-cases 10
npm run qa:fuzz:replay -- --report .agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json --finding F001
```

## Artefatos

```text
.agents/state/qa-api-fuzz/profiles/<api>.profile.json
.agents/state/qa-api-fuzz/profiles/<api>.profile.md
.agents/state/qa-api-fuzz/profile-lint/<api>/profile-lint.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.md
```

## Oraculos

O fuzz separa oraculos universais e contratuais.

Universais:

- API nao deve retornar 5xx para entrada controlavel.
- Resposta nao deve vazar stack trace, SQL, classe interna ou exception bruta.
- Content-Type deve ser coerente.
- Operacao rejeitada nao deve persistir indevidamente quando houver verificacao segura.

Contratuais:

- status exato;
- mensagem exata;
- campo obrigatorio;
- tipo, formato, enum e limite;
- permissao e regra de negocio.

Contratual so deve virar finding forte quando `confidence=confirmed`.

## Prompt recomendado

```text
Gere um profile de fuzz para a API <nome-da-api>, rode o lint do profile,
execute fuzz em modo smoke e reporte achados por severidade.
Nao promova achados para testes Cypress sem oraculo confirmado.
```
