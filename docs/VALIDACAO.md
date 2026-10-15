# Validação

## Comandos obrigatórios

```bash
npm run lint
npm test
npm run build
npm audit
```

O workflow de publicação bloqueia o deploy quando lint, testes ou build falham.

## Cobertura funcional

Os testes automatizados cobrem:

- juros compostos e conversão anual/mensal;
- inflação e valores reais;
- aportes fixos e percentuais, inclusive 13º;
- fase de saque e outras rendas;
- compra à vista, caixinha, manutenção e meta sem recursos;
- conservação dos fluxos;
- número e idade sustentada da liberdade;
- impacto do barco;
- Monte Carlo reproduzível e percentis ordenados;
- distinção entre esgotamento geral e na fase de saque;
- coerência de idades e saneamento do estado compartilhado;
- ids únicos e bloqueio de atributos invisíveis;
- entrada numérica no padrão brasileiro;
- formatação de idades e períodos.

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
6. Meta incerta no Monte Carlo: probabilidade de compra e probabilidade de duração devem aparecer separadamente.
