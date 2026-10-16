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

## Segundo ciclo — orientação e decisão

| Tema | Decisão | Evidência |
|---|---|---|
| Complexidade | Modo simples mostra decisões essenciais; avançado expõe todas as hipóteses | `PainelPremissas.tsx` |
| Diagnóstico | Separar prazo de liberdade, duração do saque e viabilidade das metas | `diagnostico.ts` |
| Recomendações | Buscar numericamente aporte, idade, despesa e alternativas de metas | `diagnostico.ts` |
| Controle | Nenhuma recomendação altera o plano sem clique explícito | `DiagnosticoPlano.tsx` |
| Comparação | Salvar uma referência local, fora do link compartilhado | `comparacao.ts` |
| Governança | Manter roadmap, changelog, templates e atualização de dependências | `.github`, `docs/ROADMAP.md` |

## Terceiro ciclo — qualidade de produção

| Tema | Decisão | Evidência |
|---|---|---|
| Offline | PWA com precache versionado, fallback de navegação e aviso de conectividade real | `vite.config.ts`, `pwa.ts` |
| Acessibilidade | Axe A/AA em desktop/mobile e contraste claro corrigido | `e2e/horizonte.spec.ts`, `index.css` |
| Desempenho | Worker próprio para recomendações, componentes memorizados e detalhes por proximidade | `useDiagnostico.ts`, `ResultadosDetalhados.tsx` |
| Orçamento | Gates de performance, acessibilidade, boas práticas, SEO e transferência | `scripts/verificar-lighthouse.mjs` |
| Responsividade | Automação para retrato, paisagem, texto a 200% e movimento reduzido | `playwright.config.ts`, `e2e/horizonte.spec.ts` |
| CI/CD | Qualidade completa antes do Pages e relatórios preservados por 14 dias | `.github/workflows/deploy.yml` |
| Release | Tags `v*` geram releases idempotentes com notas automáticas | `.github/workflows/release.yml` |
| Governança | Ownership, segurança e ruleset recomendado documentados | `.github/CODEOWNERS`, `SECURITY.md`, `docs/GITHUB.md` |

## Compatibilidade

- Links antigos sem envelope continuam aceitos.
- Estado local v1 é migrado ao ser carregado.
- O formato v2 passa a ser usado nas novas gravações e URLs.
- Metas extras com propriedades que nunca foram editáveis são convertidas para compra à vista sem manutenção.

## Quarto ciclo — fases pós-trabalho

| Tema | Decisão | Evidência |
|---|---|---|
| Contrato | Fases temporárias são adicionais à renda e à despesa permanentes | `docs/MODELO_FINANCEIRO.md` |
| Intervalo | Início inclusivo e fim exclusivo, sempre dentro da fase pós-trabalho | `normalizarFluxoPosParar` |
| Sobreposição | Fluxos simultâneos são somados, sem prioridade escondida | `src/engine/projecao.ts` |
| Principal | Despesa temporária não autoriza vender ativos no modo renda passiva | `engine.test.ts` |
| Transparência | Tabela e CSV mostram renda e despesa programadas separadamente | `Tabela.tsx` |
| Compatibilidade | Schema 4 aceita links 1, 2 e 3; planos anteriores recebem lista vazia | `compartilhar.ts` |
| Interface | Lista dinâmica fica no modo avançado, com vazio orientativo e anúncio acessível | `PainelPremissas.tsx` |

## Pendências conhecidas

- O modelo permanece educacional e não representa dívidas ou financiamento.
- A distribuição do Monte Carlo é deliberadamente simples e está documentada.
- A proteção da branch `main` depende da ativação manual do ruleset no painel administrativo do GitHub.
- Testes unitários de componentes isolados podem ser adicionados no futuro; os fluxos críticos da interface já são cobertos em navegador real.
