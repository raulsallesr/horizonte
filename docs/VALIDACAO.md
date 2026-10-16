# Validação

## Comandos obrigatórios

```bash
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:lighthouse
npm audit
```

O workflow de publicação bloqueia o deploy quando lint, testes unitários, E2E, Lighthouse ou build falham.

## Cobertura funcional

Os testes automatizados cobrem:

- juros compostos e conversão anual/mensal;
- inflação e valores reais;
- aportes fixos e percentuais, inclusive 13º;
- reinvestimento integral dos retornos durante a fase de trabalho;
- renda passiva limitada à distribuição, reinvestimento do excedente e déficit sem venda do principal;
- fase de retirada e outras rendas;
- fases temporárias de renda e despesa, inclusive intervalos exclusivos e sobreposição;
- compra à vista, caixinha, manutenção e meta sem recursos;
- conservação dos fluxos;
- número e idade sustentada da liberdade;
- impacto do barco;
- Monte Carlo reproduzível e percentis ordenados;
- distinção entre esgotamento geral e na fase de saque;
- migração de links antigos para a estratégia de retirada, sem mudança silenciosa de significado;
- coerência de idades e saneamento do estado compartilhado;
- ids únicos e bloqueio de atributos invisíveis;
- entrada numérica no padrão brasileiro;
- formatação de idades e períodos.
- diagnóstico de plano saudável e insuficiente;
- cálculo de aporte mínimo e primeira idade viável;
- alternativas de prazo e valor para meta sem recursos.
- reserva desativada sem regressão nos resultados anteriores;
- prioridade da reserva no aporte, conclusão sem ultrapassar a meta e investimento da sobra;
- poder de compra preservado e reserva indisponível para despesas depois de parar;
- saldo e aporte anual da reserva, saneamento de limites e migração de links v4.

O Playwright complementa os testes puros com fluxos reais em desktop e mobile: carga responsiva, modos simples/avançado, seleção da estratégia pós-trabalho, ativação da reserva, criação de fase temporária, plano inviável, comparação, detalhes sob demanda, zoom, paisagem, movimento reduzido, axe WCAG A/AA e recarregamento offline.

O Lighthouse exige performance ≥ 80, acessibilidade ≥ 95, boas práticas ≥ 90, SEO ≥ 90, FCP ≤ 2,5 s, LCP ≤ 3,2 s, TBT ≤ 350 ms, CLS ≤ 0,1 e transferência da aplicação ≤ 1 MB. Uma injeção local conhecida do Kaspersky é identificada e relatada, mas o limite de boas práticas continua obrigatório em ambientes limpos.

## Checklist visual e acessível

Antes de publicar uma mudança de interface:

- testar tema claro e escuro;
- testar larguras de 375, 768, 1024 e 1440 pixels;
- conferir ausência de rolagem horizontal;
- navegar apenas por teclado e verificar o foco visível;
- testar zoom de 200%;
- testar `prefers-reduced-motion`;
- conferir mensagens de erro junto aos campos;
- confirmar alvos de toque com pelo menos 44 pixels;
- conferir resumos textuais e tabela alternativa dos gráficos;
- alterar premissas rapidamente e confirmar que resultados Monte Carlo antigos desaparecem;
- simular falha do Worker e confirmar mensagem com ação de tentar novamente.

## Casos financeiros manuais

1. Meta maior que todo o patrimônio: deve aparecer como não financiada, sem saldo negativo.
2. Alterar a idade atual para depois da idade da meta: a meta deve avançar para o primeiro ano futuro válido.
3. Reduzir o horizonte: todas as metas devem permanecer antes do último ano.
4. Aporte fixo com 13º: dezembro deve ter o dobro do aporte.
5. Patrimônio cruza a liberdade antes do barco e cai depois: a liberdade só pode começar após a recuperação definitiva.
6. Reserva de R$ 5.500, meta de R$ 6.000 e aporte de R$ 1.000: reservar R$ 500 e investir os R$ 500 restantes no mesmo mês.
7. Reserva completa ao parar: despesas e déficit de renda passiva não podem reduzir o saldo protegido.
6. Meta incerta no Monte Carlo: probabilidade de compra e probabilidade de duração devem aparecer separadamente.
7. Só renda passiva, com renda inferior à despesa: o déficit deve aparecer e o principal não pode ser usado para completá-lo.
8. Só renda passiva, com renda superior à despesa: apenas a parte necessária deve sair e o excedente deve permanecer reinvestido.
9. Alternar para renda mais retiradas: o fluxo deve voltar a permitir consumo gradual do patrimônio.
10. Criar duas rendas temporárias simultâneas: ambas devem reduzir a necessidade mensal durante a interseção.
11. Encerrar uma fase aos 60 anos: ela deve valer até o mês anterior aos 60 e desaparecer a partir dessa idade.
12. Adicionar uma despesa temporária no modo renda passiva: o déficit pode aumentar, mas o principal não pode ser vendido para cobri-lo.

## Evidência do ciclo 1.1.0

Em 15/10/2026:

- `npm run lint`: aprovado;
- `npm test`: 33 testes aprovados em 4 arquivos;
- `npm run build`: aprovado com TypeScript 6 e Vite 8;
- auditoria em Chrome real: 375×812, 812×375 e 1440×1000;
- sem rolagem horizontal da página, ids duplicados, controles visíveis sem nome ou alvos de toque menores que 44 px;
- cenário inviável validado com quatro ajustes calculados e nenhuma exceção no console;
- comparação local validada com os cinco indicadores renderizados.

## Evidência do ciclo 1.2.0

Em 15/10/2026:

- `npm run lint`: aprovado;
- `npm test`: 33 testes aprovados em 4 arquivos;
- `npm run build`: aprovado, incluindo os Workers de diagnóstico e Monte Carlo e o service worker;
- `npm run test:e2e`: 16 cenários aprovados — 8 em desktop e 8 em mobile;
- axe: nenhuma violação WCAG A/AA detectável nas duas configurações;
- `npm run test:lighthouse`: aprovado com performance 91, acessibilidade 100, SEO 100, FCP 2,33 s, LCP 2,80 s, TBT 158 ms, CLS 0 e 90 KiB da aplicação;
- boas práticas locais: 81 apenas por requisições HTTP injetadas pelo Kaspersky e registradas no relatório; o gate ≥ 90 continua ativo quando o ambiente está limpo;
- `npm audit --audit-level=moderate`: 0 vulnerabilidades.

## Evidência do ciclo 1.3.0

Em 16/10/2026:

- `npm run lint`: aprovado;
- `npm test`: 40 testes aprovados em 4 arquivos;
- `npm run build`: aprovado com TypeScript 6 e Vite 8;
- `npm run test:e2e`: 18 cenários aprovados — 9 em desktop e 9 em mobile;
- axe: nenhuma violação WCAG A/AA detectável nas duas configurações;
- estratégia, ajuda contextual e campos condicionais validados sem rolagem horizontal, inclusive em paisagem, texto a 200% e movimento reduzido.
- `npm run test:lighthouse`: aprovado com performance 91, acessibilidade 100, SEO 100, FCP 2,43 s, LCP 2,86 s, TBT 144 ms, CLS 0,03 e 91 KiB da aplicação;
- boas práticas locais: 81 apenas pela injeção conhecida do Kaspersky; o gate ≥ 90 permanece ativo em CI limpa;
- `npm audit --audit-level=moderate`: 0 vulnerabilidades.

## Evidência local do ciclo 1.4.0

Em 16/10/2026, antes da publicação:

- `npm run lint`: aprovado;
- `npm test`: 45 testes aprovados em 4 arquivos;
- `npm run build`: aprovado com TypeScript 6 e Vite 8;
- `npm run test:e2e`: 20 cenários aprovados — 10 em desktop e 10 em mobile;
- axe: nenhuma violação WCAG A/AA detectável nas duas configurações;
- criação e troca de tipo da fase validadas sem rolagem horizontal em desktop e mobile;
- temas claro e escuro revisados visualmente em 390 × 844 pixels;
- `npm audit --audit-level=moderate`: 0 vulnerabilidades;
- o Lighthouse local sofreu tarefas longas atípicas e injeção conhecida do Kaspersky; os limites não foram reduzidos e a publicação exige aprovação no runner limpo do GitHub Actions.
- GitHub Actions: pipeline `38918089806` aprovado, inclusive gates de Lighthouse, seguido de deploy no GitHub Pages;
- release `v1.4.0`: workflow `38918426904` aprovado.

## Evidências da v1.5.0 — 16/10/2026

- `npm run lint`: aprovado;
- `npm test`: 51 testes aprovados em 4 arquivos;
- `npm run build`: aprovado com TypeScript 6 e Vite 8;
- `npm run test:e2e`: 22 cenários aprovados — 11 em desktop e 11 em mobile;
- axe: nenhuma violação WCAG A/AA detectável nas duas configurações;
- reserva ativada e inspecionada visualmente em tema claro a 1440 × 1000 e tema escuro a 390 × 844 pixels;
- `npm audit --audit-level=moderate`: 0 vulnerabilidades;
- Lighthouse local: acessibilidade 100, SEO 100, LCP 2,98 s, CLS 0,03 e 93 KiB transferidos; performance 77, FCP 2,56 s e TBT 533 ms ficaram abaixo do gate local durante a interferência já conhecida do Kaspersky;
- os limites não foram reduzidos: a publicação da v1.5.0 depende da aprovação integral no runner limpo do GitHub Actions.
