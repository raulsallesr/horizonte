# Registro de melhorias — 15/10/2026

## Contexto

Uma revisão integral do Horizonte encontrou boa arquitetura e apresentação, mas também estados capazes de transmitir certeza indevida. Este ciclo priorizou integridade do modelo, rastreabilidade e acessibilidade antes de novas funcionalidades.

## Decisões implementadas

| Tema | Decisão | Evidência |
|---|---|---|
| Meta sem saldo | Não comprar, não criar dívida e informar déficit | `src/engine/projecao.ts` |
| Duração | Medir esgotamento apenas depois de parar | `esgotouNaFaseDeSaqueK` |
| Liberdade | Exigir permanência acima da meta | `mesQueSustenta` |
| Idades | Manter barco e extras dentro do horizonte | `normalizar` |
| 13º | Aplicar aporte adicional também no modo fixo | projeção mensal |
| Monte Carlo | Encerrar Worker obsoleto e limpar resultado antigo | `useMonteCarlo` |
| Metas no Monte Carlo | Calcular probabilidade individual de realização | `probMetas` |
| Links | Envelope versionado, compatibilidade v1 e falha visível | `compartilhar.ts` |
| Formulários | Aceitar pt-BR e mostrar erros no próprio campo | `numeros.ts`, `ui.tsx` |
| Gráficos | Resumo textual e tabela alternativa | `Graficos.tsx`, `Tabela.tsx` |
| Mobile | Alvos de 44 px e retorno rápido aos resultados | `index.css`, `PainelPremissas.tsx` |
| Performance | Lazy loading de gráficos e tabela | `ResultadosDetalhados.tsx` |
| CI | Lint antes de teste e build | `.github/workflows/deploy.yml` |

## Compatibilidade

- Links antigos sem envelope continuam aceitos.
- Estado local v1 é migrado ao ser carregado.
- O formato v2 passa a ser usado nas novas gravações e URLs.
- Metas extras com propriedades que nunca foram editáveis são convertidas para compra à vista sem manutenção.

## Pendências conhecidas

- O modelo permanece educacional e não representa dívidas ou financiamento.
- A distribuição do Monte Carlo é deliberadamente simples e está documentada.
- Testes de componentes no DOM podem ser adicionados no futuro com uma biblioteca específica; a lógica crítica permanece extraída e testada como funções puras.
