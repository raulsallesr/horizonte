# Modelo financeiro

Este documento descreve o contrato do simulador. Alterações nessas regras devem vir acompanhadas de testes e atualização deste arquivo.

## Ordem mensal dos eventos

Para cada mês:

1. patrimônio e caixinhas recebem o retorno do mês;
2. enquanto a pessoa trabalha, entra o aporte;
3. depois de parar, sai a despesa líquida de outras rendas;
4. parte do aporte pode ser destinada à caixinha;
5. metas previstas para o mês são avaliadas;
6. custos de manutenção de metas já compradas são debitados;
7. o saldo final do mês é armazenado.

Taxas anuais são convertidas para mensais por `(1 + taxa)^(1/12) - 1`.

## Valores reais e nominais

- Entradas informadas pelo usuário são valores de hoje, salvo indicação contrária.
- Salário, aporte fixo, despesas e metas são atualizados pela inflação.
- O patrimônio real é o patrimônio nominal dividido pelo deflator acumulado.
- Rentabilidades dos cenários são nominais, líquidas de IR e custos.

## Aportes e 13º

- No modo percentual, dezembro usa duas remunerações quando o 13º está ativo.
- No modo fixo, dezembro também realiza um aporte adicional de mesmo valor.
- Crescimento real do salário e do aporte fixo ocorre em degraus anuais.

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
  max(0, despesa mensal - outra renda mensal) × 12 ÷ taxa de retirada
```

A idade da liberdade não é apenas o primeiro cruzamento. É o começo do trecho final em que o patrimônio real permanece acima do número da liberdade até o encerramento do horizonte. Para calcular essa data, a pessoa continua trabalhando e aportando; a idade escolhida para parar é avaliada separadamente nos KPIs.

Essa definição evita declarar liberdade pouco antes de uma meta futura derrubar novamente o saldo.

## Probabilidade de duração

“Dinheiro durar” significa não esgotar o patrimônio depois do início da fase de saque. Um saldo baixo ou zerado enquanto a pessoa ainda trabalha não é, isoladamente, uma falha de aposentadoria.

Uma trajetória pode ter o dinheiro durando e, ao mesmo tempo, não conseguir realizar uma meta. Por isso as probabilidades são apresentadas separadamente.

## Monte Carlo

- Usa somente o cenário Base.
- Gera retornos mensais independentes com distribuição normal.
- Média e volatilidade vêm das premissas do cenário.
- Retornos mensais são limitados a no mínimo `-99%`.
- Executa 5.000 trajetórias com semente fixa para permitir reprodução e comparação.
- Calcula percentis 10, 50 e 90, liberdade sustentada, duração na fase de saque e realização das metas.

## Diagnóstico e ajustes calculados

O diagnóstico usa exclusivamente o cenário Base determinístico e avalia três condições independentes:

1. o patrimônio real na idade de parar cobre o número da liberdade;
2. o patrimônio não zera durante a fase de saque;
3. todas as metas são realizadas sem criar dívida.

Os ajustes exibidos são buscas numéricas sobre o mesmo motor:

- **aporte mínimo**: menor aporte fixo mensal, em R$ de hoje, sem aumento real, que atende as três condições;
- **idade viável**: primeira idade inteira, a partir da escolhida, em que o plano atende as três condições;
- **despesa sustentável**: maior despesa mensal estimada que preserva o plano e as metas;
- **meta inviável**: primeira idade posterior em que a compra cabe ou maior valor que cabe na data original.

Cada alternativa é recalculada isoladamente. Ela não é aplicada sem ação explícita e não representa recomendação financeira profissional. A opção de financiamento permanece fora do modelo porque exigiria um contrato completo de dívida, com juros, prazo e impacto no fluxo mensal.

### Limitações

O modelo não inclui correlação temporal, mudanças de regime, caudas extremas específicas, tributação individual por ativo, custos de transação detalhados, financiamento, dívidas ou mudanças discricionárias de consumo. Ele é educacional e não substitui planejamento financeiro profissional.
