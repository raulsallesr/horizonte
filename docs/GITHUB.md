# Governança no GitHub

## Fluxo da branch principal

Todo `push` em `main` dispara `.github/workflows/deploy.yml`. O job `build` instala dependências de forma reproduzível, executa lint, testes unitários, build, Playwright e Lighthouse, e guarda os relatórios por 14 dias. O deploy no GitHub Pages só começa depois desse job concluir com sucesso.

Arquivos sem proprietário específico são atribuídos a `@raulsallesr` pelo `CODEOWNERS`. Dependências npm e Actions são revisadas mensalmente pelo Dependabot.

## Proteção recomendada para `main`

A configuração abaixo depende do painel administrativo do repositório e não fica armazenada no Git:

1. abrir **Settings → Rules → Rulesets → New branch ruleset**;
2. selecionar a branch `main`;
3. bloquear exclusão e `force push`;
4. exigir que o status check `build` passe antes do merge;
5. exigir resolução das conversas;
6. opcionalmente exigir um pull request e uma aprovação quando houver outro revisor disponível.

Para um repositório mantido por uma única pessoa, a aprovação obrigatória pode impedir correções urgentes. O check `build`, a proibição de `force push` e a resolução de conversas são o mínimo recomendado.

## Releases

O projeto segue versões semânticas. Para publicar:

1. mover as notas de `Não publicado` para a nova versão em `CHANGELOG.md`;
2. atualizar `package.json` e `package-lock.json`;
3. validar todos os comandos de `docs/VALIDACAO.md`;
4. criar e enviar a tag anotada, por exemplo `git tag -a v1.2.0 -m "Horizonte v1.2.0"` e `git push origin v1.2.0`;
5. acompanhar o workflow `Criar release`, que publica notas automáticas para a tag.

O workflow é idempotente: se a release da tag já existir, encerra sem duplicá-la.

## Evidências e incidentes

- relatórios Playwright e Lighthouse: artefato `relatorios-qualidade` de cada execução;
- mudanças visíveis: `CHANGELOG.md`;
- decisões e riscos conhecidos: `docs/REGISTRO_MELHORIAS_2026-10-15.md`;
- vulnerabilidades: processo privado descrito em `SECURITY.md`.
