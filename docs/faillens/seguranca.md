# Seguranca do FailLens

FailLens foi desenhado para rodar localmente e preservar evidencias de teste.

## Propriedades

- Processamento local.
- Sem telemetria.
- Sem servico externo.
- Sem dependencia de internet para abrir HTML.
- Servidor local restrito a `127.0.0.1`.

## Segredos

Em ambiente controlado, o relatorio pode manter tokens, senhas de teste, headers e bodies para permitir replay fiel.

Por isso:

- nao publique `reports/faillens/` sem revisao;
- nao envie HTML/JSON para fora do ambiente autorizado;
- configure mascaras quando o dominio tiver segredos especificos;
- trate artifacts de CI como sensiveis.

## Mascaras opcionais

Exemplo de `faillens.config.js`:

```js
module.exports = {
  maskFields: ["authorization", "cookie", "password", "token"],
  maskPatterns: ["recovery-code=[A-Z0-9-]+"],
}
```

Mascaras devem ser especificas para nao esconder informacao util de debug.
