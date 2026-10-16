# Roadmap do Horizonte

O roadmap prioriza confiabilidade antes de ampliar o realismo do modelo. Datas não são prometidas; cada etapa só é concluída com teste, documentação e evidência de uso.

## Entregue — v1.1.0

- correções de integridade do motor e das metas;
- Monte Carlo cancelável, com progresso e probabilidade por meta;
- validação de entradas e links versionados;
- acessibilidade, responsividade e carregamento sob demanda;
- modo simples e avançado;
- diagnóstico do plano e ajustes calculados;
- comparação local entre versões do plano;
- documentação técnica e governança básica no GitHub.

## Entregue — v1.2.0 (qualidade de produção)

- testes E2E em desktop e mobile com Playwright;
- auditoria automatizada de acessibilidade;
- orçamento de desempenho e acompanhamento com Lighthouse;
- PWA com mensagem clara de funcionamento offline;
- automação de release baseada no changelog.

O Dependabot já monitora mensalmente dependências npm e GitHub Actions.

## Entregue — v1.3.0 (renda passiva)

- estratégia para reinvestir todos os rendimentos enquanto trabalha e viver somente da renda distribuída depois;
- modo alternativo de renda mais retiradas, preservando o contrato anterior;
- taxa de renda passiva separada e sem dupla contagem com o retorno total;
- déficit de renda explícito, sem venda automática do principal;
- diagnóstico, Monte Carlo, gráficos, tabela, CSV e links compartilháveis alinhados à estratégia;
- migração conservadora de planos anteriores para o modo de retirada.

## Entregue — v1.4.0 (fases pós-trabalho)

- rendas e despesas mensais temporárias com idades de início e fim;
- sobreposição aditiva de fases, sem prioridade oculta;
- aposentadoria parcial por renda de trabalho com prazo após encerrar a atividade principal;
- fluxos considerados na projeção, diagnóstico, recomendações e Monte Carlo;
- auditoria das fases na tabela e no CSV;
- schema 4 compatível com links e dados anteriores.

## Entregue — v1.5.0 (reserva de emergência)

- saldo protegido separado do patrimônio investido e da renda passiva;
- meta configurável em meses da despesa permanente;
- prioridade mensal no aporte enquanto a pessoa trabalha, sem ultrapassar a meta;
- correção somente pela inflação, sem ganho real presumido;
- reserva indisponível para despesas planejadas, déficits, retiradas e metas;
- KPI, tabela e CSV próprios para auditar saldo e aportes;
- schema 5 compatível com links e dados das versões 1 a 4.

## Próxima etapa — governança e evolução do produto

- ativar no painel do GitHub o ruleset documentado para a branch `main`;
- observar a estabilidade dos novos gates em execuções reais da CI;
- priorizar a próxima evolução financeira com contrato, exemplo e teste antes da implementação;
- revisar a experiência de instalação da PWA em aparelhos físicos.

## Evolução financeira

- custos e tributação mais detalhados;
- retirada dinâmica na fase de aposentadoria;
- regimes variáveis de inflação e retorno;
- simulação histórica e bootstrap, além da distribuição normal atual.

Financiamento de metas só entrará quando houver um contrato explícito de dívida (entrada, taxa, prazo, parcela e amortização). Até lá, o simulador continuará falhando fechado, sem criar dívida silenciosa.

## Critério de conclusão

Uma melhoria só muda de seção quando tiver:

1. regra documentada;
2. teste automatizado proporcional ao risco;
3. validação de interface quando aplicável;
4. registro no `CHANGELOG.md`;
5. workflow verde no GitHub Actions.
