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

## Próxima etapa — governança e evolução do produto

- ativar no painel do GitHub o ruleset documentado para a branch `main`;
- observar a estabilidade dos novos gates em execuções reais da CI;
- priorizar a próxima evolução financeira com contrato, exemplo e teste antes da implementação;
- revisar a experiência de instalação da PWA em aparelhos físicos.

## Evolução financeira

- fases configuráveis de renda e despesas;
- aposentadoria parcial e rendas com início e fim;
- reserva de emergência separada;
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
