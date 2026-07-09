# Criar Nova Skill

Toda nova skill deve nascer com documentacao operacional e documentacao humana.

## Arquivos minimos

```text
<skill>/
  SKILL.md
  README.md
```

Quando houver comandos:

```text
<skill>/
  tools/
    README.md
```

Quando houver fluxo complexo:

```text
<skill>/
  agents/
  templates/
  references/
  docs/
```

## Documentacao no portal

Adicione:

```text
docs/skills/<skill>.md
```

E atualize `mkdocs.yml`.

## Template de pagina

```text
# <skill>

## Objetivo
## Quando usar
## Quando nao usar
## Fluxo
## Comandos
## Artefatos
## Prompts recomendados
## Regras de seguranca
## Relacao com outras skills
```

## Regras

- `SKILL.md` orienta agente.
- `README.md` orienta uso local da skill.
- `docs/skills/*.md` orienta pessoas no portal.
- Prompts precisam ser copiaveis.
- Comandos precisam indicar contexto de execucao.
