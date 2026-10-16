export type IdCenario = 'pessimista' | 'base' | 'otimista'
export type EstrategiaPosParar = 'renda_passiva' | 'retirada'
export type TipoFluxoPosParar = 'renda' | 'despesa'

export interface Cenario {
  id: IdCenario
  nome: string
  /** Rentabilidade nominal líquida (já após IR e custos), % a.a. */
  rentAnual: number
  /** Volatilidade anual, % a.a. (usada só na simulação Monte Carlo) */
  vol: number
}

export type ModoCompra = 'vista' | 'caixinha'

export interface Compra {
  id: string
  nome: string
  /** Valor em R$ de hoje. */
  valor: number
  /** Idade em que a compra acontece. */
  idade: number
  /** Custo anual de manutenção, % do valor (corrigido pela inflação). */
  manutencaoPct: number
  /** 'vista' tira do patrimônio; 'caixinha' separa parte do aporte até a compra. */
  modo: ModoCompra
  /** Quanto separar por mês (R$ de hoje) quando modo = 'caixinha'. */
  caixinhaMensal: number
}

export interface FluxoPosParar {
  id: string
  nome: string
  tipo: TipoFluxoPosParar
  /** Valor mensal em R$ de hoje, corrigido pela inflação durante a projeção. */
  valorMensal: number
  /** A fase começa nesta idade, inclusive. */
  idadeInicio: number
  /** A fase termina nesta idade, exclusive. */
  idadeFim: number
}

export interface Premissas {
  nome: string
  /** Ano de referência (hoje) — só para rotular as projeções. */
  anoBase: number
  idadeAtual: number
  idadeParar: number
  idadeFinal: number
  patrimonioInicial: number
  /** Salário líquido mensal, R$ de hoje. */
  salarioMensal: number
  /** Aumento real do salário, % a.a. (acima da inflação). */
  aumentoRealSalario: number
  decimoTerceiro: boolean
  aporteModo: 'percentual' | 'fixo'
  aportePercentual: number
  /** Aporte fixo mensal, R$ de hoje. */
  aporteFixo: number
  /** Crescimento real do aporte fixo, % a.a. */
  aumentoRealAporte: number
  /** Inflação (IPCA), % a.a. */
  inflacao: number
  /** Despesa mensal desejada na liberdade, R$ de hoje. */
  despesaMensal: number
  /** Outra renda mensal após parar de trabalhar (INSS, aluguel...), R$ de hoje. */
  outraRendaPosParar: number
  /** Como as despesas serão pagas depois de parar de trabalhar. */
  estrategiaPosParar: EstrategiaPosParar
  /** Parcela anual líquida do retorno total distribuída como renda, % a.a. */
  taxaRendaPassiva: number
  /** Taxa de retirada segura, % a.a. do patrimônio (real). */
  taxaRetirada: number
  /** Rendas e despesas mensais temporárias depois de parar de trabalhar. */
  fluxosPosParar: FluxoPosParar[]
  cenarios: Record<IdCenario, Cenario>
  barco: Compra & { ativo: boolean }
  extras: Compra[]
}

export interface Serie {
  /** Meses simulados (N). Os arrays de patrimônio/deflator têm N+1 pontos. */
  meses: number
  idadeAtual: number
  /** Patrimônio nominal ao fim de cada mês (índice 0 = hoje). Inclui caixinha. */
  pat: Float64Array
  /** Deflator de preços: (1+inflação)^(k/12). */
  defl: Float64Array
  /** Fluxos do mês k (índice 0 = 0). */
  aporte: Float64Array
  rendimento: Float64Array
  /** Renda distribuída disponível no mês; o excedente permanece reinvestido. */
  rendaPassiva: Float64Array
  /** Parte da despesa que a renda distribuída não cobriu; não é debitada do principal. */
  deficitRenda: Float64Array
  /** Rendas temporárias ativas no mês, sem incluir a outra renda permanente. */
  rendaProgramada: Float64Array
  /** Despesas temporárias somadas à despesa-base no mês. */
  despesaProgramada: Float64Array
  retirada: Float64Array
  compra: Float64Array
  /** Índice do mês em que o patrimônio zerou, ou -1. */
  esgotouK: number
  /** Primeiro mês de esgotamento depois de parar de trabalhar, ou -1. */
  esgotouNaFaseDeSaqueK: number
  /** Primeiro mês em que faltou renda passiva depois de parar, ou -1. */
  faltouRendaNaFasePosPararK: number
  /** Resultado das metas no mês planejado. Vazio no caminho rápido, salvo se solicitado. */
  metas: ResultadoMeta[]
}

export type StatusMeta = 'realizada' | 'sem_recursos' | 'fora_do_horizonte'

export interface ResultadoMeta {
  id: string
  nome: string
  idade: number
  status: StatusMeta
  /** Custo e recursos disponíveis em valores nominais do mês planejado. */
  custoNominal: number
  recursosNominais: number
  deficitNominal: number
  /** Deflator do mês planejado, para converter o déficit para R$ de hoje. */
  deflator: number
}

export interface LinhaAnual {
  idade: number
  ano: number
  patNominal: number
  patReal: number
  aporte: number
  rendimento: number
  /** Rendimento acima da inflação do ano, já em R$ de hoje (nominal menos a erosão do saldo). */
  rendimentoReal: number
  rendaPassiva: number
  deficitRenda: number
  rendaProgramada: number
  despesaProgramada: number
  retirada: number
  compra: number
  /** Deflator no fim do ano. */
  defl: number
}
