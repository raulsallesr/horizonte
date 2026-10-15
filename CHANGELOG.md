# Changelog

Todas as mudanças relevantes do projeto serão registradas neste arquivo.

## Não publicado

### Adicionado

- Probabilidade Monte Carlo de realização de cada meta.
- Déficit explícito para metas sem recursos.
- Estado de progresso, erro e nova tentativa para o Monte Carlo.
- Resumos acessíveis dos gráficos e tabela com legenda semântica.
- Entrada numérica brasileira com validação no próprio campo.
- Documentação de arquitetura, modelo e validação.

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
