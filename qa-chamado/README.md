# QA Chamado Skill

Skill para transformar problemas de QA já analisados em rascunhos de chamados.

## Uso

```text
Crie chamados para os problemas 1 e 3.
```

## Entrada ideal

Uma análise anterior com problemas numerados, classificação, confiança, evidências, resultado atual, resultado esperado e limitações.

## O que a skill faz

- seleciona apenas os problemas pedidos pelo usuário;
- valida se cada problema merece chamado;
- agrupa problemas com mesma causa e comportamento;
- separa problemas diferentes;
- sanitiza tokens, cookies, senhas, Authorization e credenciais;
- entrega rascunhos de chamado sem abrir item em ferramenta externa.

## O que a skill não faz

- não cria nem altera testes;
- não investiga tudo do zero;
- não inventa contrato ou causa raiz;
- não transforma problema inconclusivo em defeito confirmado.
