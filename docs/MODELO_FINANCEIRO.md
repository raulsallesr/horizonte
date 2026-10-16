# Modelo financeiro

Este documento descreve o contrato do simulador. Alterações nessas regras devem vir acompanhadas de testes e atualização deste arquivo.

## Ordem mensal dos eventos

Para cada mês:

1. a reserva acompanha a inflação; patrimônio e caixinhas recebem o retorno do mês;
2. enquanto a pessoa trabalha, todo o retorno permanece reinvestido e o aporte do mês é calculado;
3. a reserva recebe primeiro sua parcela, limitada pelo aporte disponível e pelo valor que falta para a meta;
4. depois de parar, a estratégia escolhida define quanto pode sair do patrimônio investido;
5. parte do aporte restante pode ser destinada à caixinha;
6. metas previstas para o mês são avaliadas;
7. custos de manutenção de metas já compradas são debitados;
8. os saldos finais do mês são armazenados separadamente.

Rentabilidade e inflação anuais são convertidas para mensais por `(1 + taxa)^(1/12) - 1`. A taxa anual de renda distribuída é dividida por 12, pois representa o fluxo anual pago pelo patrimônio, e não uma rentabilidade adicional.

## Valores reais e nominais

- Entradas informadas pelo usuário são valores de hoje, salvo indicação contrária.
- Salário, aporte fixo, despesas e metas são atualizados pela inflação.
- O patrimônio real é o patrimônio nominal dividido pelo deflator acumulado.
- Rentabilidades dos cenários são nominais, líquidas de IR e custos.

## Aportes e 13º

- No modo percentual, dezembro usa duas remunerações quando o 13º está ativo.
- No modo fixo, dezembro também realiza um aporte adicional de mesmo valor.
- Crescimento real do salário e do aporte fixo ocorre em degraus anuais.
- O 13º aumenta o aporte total disponível em dezembro, mas não dobra a parcela mensal configurada para a reserva.

## Reserva de emergência

A reserva é opcional e possui saldo próprio. Ela não integra `patrimônioInicial`, o número da liberdade ou os recursos disponíveis para renda passiva, retiradas, caixinhas e compras.

- A meta real é `despesa mensal permanente × meses de despesa`.
- Fases temporárias não alteram a meta, porque representam eventos planejados e não emergências.
- Enquanto a pessoa trabalha, a reserva tem prioridade sobre caixinhas e investimentos até completar a meta.
- Se falta menos que a parcela mensal configurada, somente o valor necessário é reservado e a sobra é investida no mesmo mês.
- Depois de completar a meta, todo o aporte volta automaticamente aos investimentos e caixinhas.
- O saldo acompanha a inflação, equivalente a retorno real zero; o modelo não presume rentabilidade adicional.
- Um saldo inicial acima da meta é preservado, sem transferência automática do excesso.
- Depois da idade de parar, a reserva permanece protegida: não recebe novos aportes e não cobre despesas, déficit de renda passiva, metas ou retiradas.
- Ao informar o saldo da reserva, a pessoa deve excluí-lo do campo de patrimônio investido para evitar dupla contagem.

Com a função desativada, resultados de planos anteriores permanecem idênticos. A tabela e o CSV apresentam saldo e aportes da reserva em colunas separadas quando ela está ativa.

## Estratégia depois de parar

O usuário escolhe explicitamente um dos contratos abaixo.

### Só renda passiva

- Durante a fase de trabalho, dividendos, juros e demais retornos são integralmente reinvestidos junto com os aportes.
- Depois de parar, a renda distribuída disponível no mês é limitada a `patrimônio no início do mês × taxa de renda passiva ÷ 12`.
- A taxa de renda passiva é uma parcela da rentabilidade total do cenário, nunca um retorno somado a ela.
- A despesa usa primeiro outras rendas informadas e depois somente a renda distribuída necessária.
- O excedente da renda distribuída permanece reinvestido.
- Se a renda distribuída não cobrir a despesa, a diferença é registrada como déficit não coberto. O motor não vende ativos nem debita essa diferença do principal.

Não vender ativos não garante que o valor de mercado do patrimônio permaneça constante: retornos negativos, inflação, metas e custos de manutenção ainda podem reduzi-lo.

### Renda mais retiradas

- Preserva o contrato das versões anteriores.
- Depois de parar, a despesa líquida de outras rendas é retirada do patrimônio.
- Rendimentos e venda gradual de ativos não são separados contabilmente.
- O patrimônio pode chegar a zero quando as retiradas superam o saldo disponível.

Planos e links anteriores à versão 3 do schema continuam nesse modo para evitar mudança silenciosa de significado. O schema 5 aceita links das versões 1 a 4; os que não possuem fases recebem uma lista vazia e os que não possuem reserva recebem a função desativada, preservando o patrimônio investido original.

## Fases temporárias após parar

Rendas e despesas com prazo são fluxos adicionais aplicados somente depois da idade de parar de trabalhar.

- Cada fase tem tipo, nome, valor mensal em R$ de hoje e idades de início e fim.
- A idade inicial é inclusiva; a idade final é exclusiva. Uma fase dos 55 aos 60 vale até o mês anterior aos 60 anos.
- Rendas temporárias são somadas à outra renda permanente antes de calcular quanto falta para a despesa do mês.
- Despesas temporárias são somadas à despesa-base.
- Fases simultâneas são somadas; não há prioridade oculta entre elas.
- Os valores acompanham a inflação, como as demais entradas expressas em R$ de hoje.
- No modo só renda passiva, os fluxos alteram a parcela necessária e o eventual déficit, mas continuam sem autorizar venda do principal.
- No modo renda mais retiradas, os fluxos alteram a retirada mensal do patrimônio.
- Sem fases cadastradas, o resultado é idêntico ao contrato da versão 1.3.0.

O número da liberdade permanece baseado na despesa e na outra renda **permanentes**. Fases com prazo entram na projeção, no diagnóstico, nas recomendações e no Monte Carlo, mas não reduzem esse alvo estrutural. A tabela e o CSV mostram os valores programados separadamente para auditoria.

## Metas

Uma meta só é realizada se, na idade planejada, houver recursos suficientes para pagar seu custo integral.

- À vista: usa o patrimônio investido.
- Caixinha: usa primeiro o total reservado e depois o patrimônio.
- Sem recursos: a compra não acontece, não há manutenção e nenhuma dívida é criada.
- Se uma caixinha for insuficiente, o valor reservado volta ao patrimônio.
- A interface informa o déficit em R$ de hoje.
- Quando duas metas vencem no mesmo mês, o barco é avaliado primeiro e as metas extras seguem a ordem exibida no painel.

Metas extras são sempre compras à vista e sem manutenção, porque estes são os únicos atributos editáveis para elas na interface atual.

## Liberdade financeira

```text
número da liberdade =
  max(0, despesa mensal - outra renda mensal) × 12 ÷ taxa da estratégia
```

No modo **só renda passiva**, a taxa da estratégia é a renda passiva líquida esperada. No modo **renda mais retiradas**, é a taxa de retirada sustentável.

A idade da liberdade não é apenas o primeiro cruzamento. É o começo do trecho final em que o patrimônio real permanece acima do número da liberdade até o encerramento do horizonte. Para calcular essa data, a pessoa continua trabalhando e aportando; a idade escolhida para parar é avaliada separadamente nos KPIs.

Essa definição evita declarar liberdade pouco antes de uma meta futura derrubar novamente o saldo.

## Probabilidade de sustentação

- Só renda passiva: uma trajetória sustenta o plano quando não há déficit de renda após parar e o patrimônio não é esgotado por metas ou custos explícitos.
- Renda mais retiradas: uma trajetória sustenta o plano quando o patrimônio não zera depois do início das retiradas.

Uma trajetória pode sustentar a estratégia e, ao mesmo tempo, não conseguir realizar uma meta. Por isso as probabilidades são apresentadas separadamente.

## Monte Carlo

- Usa somente o cenário Base.
- Gera retornos mensais independentes com distribuição normal.
- Média e volatilidade vêm das premissas do cenário.
- Retornos mensais são limitados a no mínimo `-99%`.
- Executa 5.000 trajetórias com semente fixa para permitir reprodução e comparação.
- Calcula percentis 10, 50 e 90, liberdade sustentada, sustentação da estratégia pós-trabalho e realização das metas.

## Diagnóstico e ajustes calculados

O diagnóstico usa exclusivamente o cenário Base determinístico e avalia três condições independentes:

1. o patrimônio real na idade de parar cobre o alvo da estratégia;
2. a estratégia pós-trabalho sustenta as despesas até o horizonte final;
3. todas as metas são realizadas sem criar dívida.

Os ajustes exibidos são buscas numéricas sobre o mesmo motor:

- **aporte mínimo**: menor aporte fixo mensal, em R$ de hoje, sem aumento real, que atende as três condições;
- **idade viável**: primeira idade inteira, a partir da escolhida, em que o plano atende as três condições;
- **despesa sustentável**: maior despesa mensal estimada que preserva o plano e as metas;
- **meta inviável**: primeira idade posterior em que a compra cabe ou maior valor que cabe na data original.

Cada alternativa é recalculada isoladamente. Ela não é aplicada sem ação explícita e não representa recomendação financeira profissional. A opção de financiamento permanece fora do modelo porque exigiria um contrato completo de dívida, com juros, prazo e impacto no fluxo mensal.

### Limitações

O modelo não inclui correlação temporal, mudanças de regime, caudas extremas específicas, variação independente dos dividendos, quantidade de cotas/ações, tributação individual por ativo, custos de transação detalhados, financiamento, dívidas ou mudanças discricionárias de consumo. Ele é educacional e não substitui planejamento financeiro profissional.
