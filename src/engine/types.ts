export type IdCenario = 'pessimista' | 'base' | 'otimista'

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
  /** Taxa de retirada segura, % a.a. do patrimônio (real). */
  taxaRetirada: number
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
  retirada: Float64Array
  compra: Float64Array
  /** Índice do mês em que o patrimônio zerou, ou -1. */
  esgotouK: number
  /** Primeiro mês de esgotamento depois de parar de trabalhar, ou -1. */
  esgotouNaFaseDeSaqueK: number
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
  retirada: number
  compra: number
  /** Deflator no fim do ano. */
  defl: number
}
