# Fazer Fuzzing

Fuzzing e uma trilha investigativa. Ele busca robustez e suspeitas, sem substituir testes oficiais.

## Fluxo seguro

```bash
npm run qa:fuzz:profile -- --api <nome-da-api> --base-url http://localhost:3100
npm run qa:fuzz:lint -- --api <nome-da-api>
npm run qa:fuzz -- --api <nome-da-api> --mode smoke
```

## Antes de deep fuzz

Confirme:

- ambiente alvo seguro;
- base URL correta;
- autenticacao controlada;
- massa de teste isolada;
- cleanup de recursos criados;
- risco aceitavel para POST, PUT, PATCH e DELETE.

## Reproduzir achado

```bash
npm run qa:fuzz:replay -- --report .agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json --finding F001
```

## Promover para Cypress

Promova apenas quando:

- o achado for reproduzivel;
- o oraculo for confirmado;
- a massa e cleanup forem seguros;
- o caso representar regra ou risco relevante.

Se faltar oraculo, registre como `Nao confirmado`.
