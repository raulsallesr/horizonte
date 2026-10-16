# Continuidade do Horizonte

Este arquivo é o ponto de retomada entre sessões. Leia-o antes de iniciar uma nova frente e atualize-o ao concluir qualquer lote material de trabalho.

- **Última atualização:** 16/10/2026
- **Estado publicado:** `v1.4.0`
- **Commit da release:** `79201fc` (`feat: adicionar fases pos-trabalho`)

## Estado atual

- site público: <https://raulsallesr.github.io/horizonte/>;
- release: <https://github.com/raulsallesr/horizonte/releases/tag/v1.4.0>;
- pipeline de publicação validado: <https://github.com/raulsallesr/horizonte/actions/runs/38918089806>;
- workflow de release validado: <https://github.com/raulsallesr/horizonte/actions/runs/38918426904>;
- o bundle público foi comparado com o build local por SHA-256 e ambos resultaram em `D2AE78373AA7A639EB2ECCA2A10246D7F51EAC8E8647AFEB34814003CB91F095`;
- a `main` estava alinhada com `origin/main` ao publicar a entrega `v1.4.0`;
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

## O que foi entregue na v1.4.0

- fases temporárias de renda ou despesa depois de parar, com valores mensais e idades de início e fim;
- início inclusivo, fim exclusivo e soma explícita de fases simultâneas;
- suporte a trabalho parcial, benefício com início posterior, aluguel temporário e custos transitórios;
- integração com projeção, diagnóstico, recomendações, Monte Carlo, tabela, CSV e link compartilhável;
- número da liberdade preservado como alvo permanente, sem redução por renda temporária;
- schema 4 com migração de links e dados das versões anteriores para lista vazia de fases.

Validação em 16/10/2026: lint, 45 testes unitários, build e 20 cenários Playwright aprovados; axe não encontrou violações WCAG A/AA; temas claro e escuro revisados em 390 × 844 pixels; `npm audit` encontrou 0 vulnerabilidades. O Lighthouse local sofreu tarefas longas atípicas e injeção conhecida do Kaspersky, sem redução dos limites; o runner limpo do GitHub Actions aprovou todos os gates e publicou o site.

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

A API pública do GitHub foi consultada em 16/10/2026 e não retornou rulesets ativos. A ativação é administrativa e não pode ser concluída sem acesso autenticado ao painel.

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
