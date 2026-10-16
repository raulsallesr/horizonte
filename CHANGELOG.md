# Changelog

Todas as mudanças relevantes do projeto serão registradas neste arquivo.

## Não publicado

## [1.3.0] — 2026-10-16

### Adicionado

- Estratégias explícitas para viver somente da renda passiva ou combinar renda com retiradas do patrimônio.
- Taxa própria de renda passiva líquida, tratada como parte do retorno total para impedir dupla contagem.
- Registro mensal e anual da renda distribuída, da parcela utilizada e do déficit não coberto.
- Testes do reinvestimento integral, preservação do principal, reinvestimento do excedente e migração de planos antigos.

### Alterado

- Novas simulações usam por padrão a estratégia de renda passiva sem venda de ativos para completar despesas.
- Durante a fase de trabalho, todos os rendimentos permanecem explicitamente reinvestidos.
- Diagnóstico, recomendações, Monte Carlo, KPIs, gráfico de fluxos, tabela e CSV passam a respeitar a estratégia escolhida.
- Schema dos links e do armazenamento local passa à versão 3; dados anteriores continuam no modo de retirada para preservar seu significado.

### Corrigido

- O indicador antes chamado “Renda passiva sustentável” deixa de apresentar uma taxa de retirada como se fosse dividendos ou juros efetivamente distribuídos.
- Falta de renda passiva não reduz mais o principal silenciosamente: o déficit fica visível e separado do patrimônio.

## [1.2.0] — 2026-10-15

### Adicionado

- PWA instalável com manifest, ícone próprio, service worker versionado e recarregamento offline.
- Banner de conectividade baseado em sinal do navegador e verificação real de rede.
- Testes Playwright em desktop e mobile, com axe para WCAG A/AA e cenários offline.
- Gate Lighthouse com orçamentos de performance, acessibilidade, boas práticas, SEO e transferência.
- Relatórios de qualidade como artefatos do GitHub Actions.
- Release automática ao enviar tags `v*`, CODEOWNERS e política de segurança.

### Alterado

- Recomendações iterativas passam a ser calculadas em Web Worker, sem bloquear a interface.
- Gráficos e tabela carregam quando se aproximam da viewport e não rerenderizam a cada etapa do Monte Carlo.
- CI valida lint, 33 testes unitários, E2E, Lighthouse e build antes do deploy.
- Paleta clara recebe contraste AA também nos controles selecionados e estados de diagnóstico.

### Corrigido

- Assets da PWA agora ignoram diferenças de `Vary` ao consultar o cache versionado.
- Estado offline permanece correto após recarregar uma página servida pelo service worker.
- `robots.txt` deixa de retornar o HTML da aplicação.

## [1.1.0] — 2026-10-15

### Adicionado

- Probabilidade Monte Carlo de realização de cada meta.
- Déficit explícito para metas sem recursos.
- Estado de progresso, erro e nova tentativa para o Monte Carlo.
- Resumos acessíveis dos gráficos e tabela com legenda semântica.
- Entrada numérica brasileira com validação no próprio campo.
- Documentação de arquitetura, modelo e validação.
- Modos simples e avançado para as premissas.
- Diagnóstico determinístico do plano Base.
- Recomendações calculadas de aporte, prazo, despesa e alternativas para metas.
- Comparação com uma versão de referência salva somente no navegador.
- Templates de issues, roadmap e atualização automática de dependências no GitHub.

### Alterado

- Liberdade financeira agora exige permanência acima da meta.
- Compras deixam de criar déficit silencioso.
- Probabilidade de duração considera somente a fase de saque.
- Aporte fixo passa a respeitar o 13º.
- Idades de metas são normalizadas junto com o horizonte.
- Links compartilhados passam a ter versão de schema.
- Gráficos e tabela são carregados sob demanda.
- CI passa a executar lint antes dos testes e do build.

### Corrigido

- Resultados Monte Carlo antigos não permanecem visíveis após a alteração das premissas.
- Cálculos obsoletos não continuam enfileirados no Worker.
- Links inválidos não carregam silenciosamente uma simulação local diferente.
