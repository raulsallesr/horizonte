# Continuidade do Horizonte

Este arquivo é o ponto de retomada entre sessões. Leia-o antes de iniciar uma nova frente e atualize-o ao concluir qualquer lote material de trabalho.

- **Última atualização:** 16/10/2026
- **Estado publicado:** `v1.3.0`
- **Commit da release:** `c85c466` (`feat: adicionar estrategia de renda passiva`)

## Estado atual

- site público: <https://raulsallesr.github.io/horizonte/>;
- release: <https://github.com/raulsallesr/horizonte/releases/tag/v1.3.0>;
- pipeline de publicação validado: <https://github.com/raulsallesr/horizonte/actions/runs/38905667889>;
- workflow de release validado: <https://github.com/raulsallesr/horizonte/actions/runs/38906001753>;
- o bundle público foi comparado com o build local por SHA-256 e ambos resultaram em `84D119538BAE975199B4F3BCFBEE8DC9B20A2D43D5BADAA6FDF2D5DD96F392C1`;
- a `main` estava alinhada com `origin/main` ao publicar a entrega `v1.3.0`;
- o projeto é uma aplicação estática: cálculos e dados do usuário permanecem no navegador.

## O que foi entregue na v1.2.0

- PWA instalável, cache offline versionado, indicador de conexão e teste real de conectividade;
- cálculos iterativos de diagnóstico e Monte Carlo fora da thread principal, em Web Workers canceláveis;
- detalhes e gráficos pesados carregados por proximidade da área visível;
- Playwright em desktop e mobile, axe WCAG A/AA, cenários offline, paisagem, texto a 200% e movimento reduzido;
- orçamentos Lighthouse e detecção explícita da interferência local do Kaspersky;
- pipeline de lint, testes, build, E2E, Lighthouse, artefatos e deploy no GitHub Pages;
- workflow de release por tag, `CODEOWNERS`, política de segurança e documentação de governança.

## O que foi entregue na v1.3.0

- novo padrão “só renda passiva”: todos os retornos são reinvestidos enquanto a pessoa trabalha;
- depois de parar, despesas usam apenas a renda distribuída e nunca vendem o principal para cobrir faltas;
- modo anterior “renda + retiradas” continua disponível;
- taxa de renda passiva é parte do retorno total, sem dupla contagem;
- excedente de renda permanece reinvestido e déficit não coberto aparece separadamente;
- diagnóstico, Monte Carlo, gráfico, tabela, CSV, comparação e link compartilhável respeitam a estratégia;
- links e dados anteriores migram para o modo de retirada, preservando a semântica original.

Validação em 16/10/2026: lint, 40 testes unitários, build e 18 cenários Playwright aprovados; axe não encontrou violações WCAG A/AA em desktop ou mobile; Lighthouse marcou performance 91, acessibilidade 100 e SEO 100; `npm audit` encontrou 0 vulnerabilidades. O GitHub Actions concluiu com sucesso tanto a publicação do site quanto a criação do release `v1.3.0`.

## Evidências da validação

Em 15/10/2026, antes da publicação:

- lint aprovado;
- 33/33 testes unitários aprovados;
- build de produção aprovado;
- 16/16 cenários Playwright aprovados, sendo 8 desktop e 8 mobile;
- nenhuma violação WCAG A/AA detectável pelo axe;
- Lighthouse local: performance 91, acessibilidade 100, SEO 100, FCP 2,33 s, LCP 2,80 s, TBT 158 ms, CLS 0 e 90 KiB transferidos pela aplicação;
- boas práticas locais em 81 somente por requisições HTTP injetadas pelo Kaspersky; o gate de 90 permanece obrigatório em CI limpa e foi aprovado no GitHub Actions;
- `npm audit`: 0 vulnerabilidades.

Os critérios completos e os casos manuais estão em [docs/VALIDACAO.md](docs/VALIDACAO.md).

## Decisões que devem ser preservadas

- falhar fechado: uma meta sem patrimônio suficiente não cria dívida silenciosa;
- não exibir resultado antigo como se ainda correspondesse às premissas atuais;
- recomendações calculadas só alteram o plano após confirmação explícita do usuário;
- manter privacidade local e não introduzir servidor, conta ou telemetria sem decisão documentada;
- qualquer evolução financeira começa por contrato, exemplo e teste automatizado;
- uma melhoria só é considerada concluída com documentação, teste proporcional ao risco e workflow verde;
- não reduzir gates por causa da injeção local do Kaspersky; usar a execução limpa da CI como referência.
- no modo renda passiva, nunca cobrir déficit de despesas com venda silenciosa do principal;
- renda passiva distribuída compõe o retorno total do cenário e não pode ser somada novamente;
- durante a fase de trabalho, rendimentos e aportes permanecem integralmente reinvestidos.

## Pendências e próxima ordem de trabalho

1. Ativar manualmente o ruleset da branch `main` conforme [docs/GITHUB.md](docs/GITHUB.md): bloquear exclusão e `force push`, exigir o check `build` e a resolução de conversas.
2. Observar a estabilidade dos gates nas próximas execuções reais da CI.
3. Validar instalação e retomada offline da PWA em aparelhos físicos.
4. Escolher a próxima evolução financeira do [roadmap](docs/ROADMAP.md) e documentar seu contrato antes de implementar.

A ativação do ruleset é administrativa e não pode ser inferida apenas pelo conteúdo do repositório. Confirme o estado ao vivo no GitHub antes de marcá-la como concluída.

## Roteiro de retomada

```bash
git status --short --branch
git pull --ff-only
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:lighthouse
npm audit
```

Antes de alterar código, leia também:

- [CHANGELOG.md](CHANGELOG.md);
- [docs/ROADMAP.md](docs/ROADMAP.md);
- [docs/VALIDACAO.md](docs/VALIDACAO.md);
- [docs/GITHUB.md](docs/GITHUB.md);
- o histórico recente com `git log --oneline --decorate -10`;
- as execuções recentes no GitHub Actions e a release mais nova.

## Disciplina de continuidade

Ao fechar cada lote material:

1. atualizar este arquivo com estado, decisões, evidências e pendências reais;
2. registrar mudança de produto no `CHANGELOG.md` e atualizar o documento técnico correspondente;
3. executar os checks proporcionais ao risco;
4. criar um commit objetivo e enviar ao GitHub;
5. registrar aqui o link da execução relevante quando ela produzir evidência nova.

Não registrar como concluída nenhuma configuração externa que não tenha sido verificada ao vivo.
