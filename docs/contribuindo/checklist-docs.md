# Checklist de Documentacao

Use este checklist antes de considerar uma skill documentada.

## Portal

- [ ] Existe pagina em `docs/skills/`.
- [ ] A skill aparece no `mkdocs.yml`.
- [ ] A pagina tem objetivo claro.
- [ ] A pagina diz quando usar e quando nao usar.
- [ ] A pagina tem prompts copiaveis.
- [ ] A pagina lista comandos principais.
- [ ] A pagina lista artefatos gerados.
- [ ] A pagina fala de seguranca e segredos quando aplicavel.

## Operacao

- [ ] `SKILL.md` esta alinhado com a pagina humana.
- [ ] `README.md` da skill esta alinhado com os comandos atuais.
- [ ] Scripts citados existem no instalador.
- [ ] Artefatos citados batem com os caminhos reais.

## Validacao

```bash
python -m mkdocs build --strict
```

O build deve passar sem warnings.
