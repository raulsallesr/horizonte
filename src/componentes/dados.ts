import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import { numeroLiberdade } from '../engine/metas'
import { deflatorMes, resumoAnual } from '../engine/projecao'
import type { IdCenario, Premissas, Serie } from '../engine/types'

export interface Visao {
  real: boolean
  periodo: 'mensal' | 'anual'
  eixo: 'idade' | 'ano'
}

export const VISAO_PADRAO: Visao = { real: true, periodo: 'mensal', eixo: 'idade' }

/** Posição no eixo X para uma idade. */
export const xDe = (p: Premissas, v: Visao, idade: number) =>
  v.eixo === 'idade' ? idade : p.anoBase + (idade - p.idadeAtual)

export interface PontoPatrimonio {
  x: number
  idade: number
  pessimista: number
  base: number
  otimista: number
  meta: number
}

export function dadosPatrimonio(
  p: Premissas,
  series: Record<IdCenario, Serie>,
  v: Visao,
): PontoPatrimonio[] {
  const numero = numeroLiberdade(p)
  const N = series.base.meses
  const pts: PontoPatrimonio[] = []
  for (let k = 0; k <= N; k += 12) {
    const defl = series.base.defl[k]
    const val = (id: IdCenario) => (v.real ? series[id].pat[k] / defl : series[id].pat[k])
    const idade = p.idadeAtual + k / 12
    pts.push({
      x: xDe(p, v, idade),
      idade,
      pessimista: val('pessimista'),
      base: val('base'),
      otimista: val('otimista'),
      meta: v.real ? numero : numero * defl,
    })
  }
  return pts
}

export interface PontoLeque {
  x: number
  idade: number
  p10: number
  p50: number
  p90: number
  faixa: [number, number]
  meta: number
  prob: number
}

export function dadosLeque(p: Premissas, mc: ResultadoMonteCarlo, v: Visao): PontoLeque[] {
  const numero = numeroLiberdade(p)
  return mc.idades.map((idade, a) => {
    const f = v.real ? 1 : deflatorMes(p, a * 12)
    const p10 = mc.p10[a] * f
    const p90 = mc.p90[a] * f
    return {
      x: xDe(p, v, idade),
      idade,
      p10,
      p50: mc.p50[a] * f,
      p90,
      faixa: [p10, p90],
      meta: numero * f,
      prob: mc.probLiberdade[a] * 100,
    }
  })
}

export interface PontoFluxo {
  x: number
  idade: number
  aporte: number
  rendimento: number
  retirada: number
  deficitRenda: number
}

/** Fluxos anuais do cenário base; em visão mensal, média por mês. */
export function dadosFluxo(p: Premissas, s: Serie, v: Visao): PontoFluxo[] {
  const div = v.periodo === 'mensal' ? 12 : 1
  return resumoAnual(p, s).map((l) => {
    const f = (v.real ? 1 / l.defl : 1) / div
    return {
      x: xDe(p, v, l.idade),
      idade: l.idade,
      aporte: l.aporte * f,
      rendimento: (v.real ? l.rendimentoReal : l.rendimento) / div,
      retirada: -l.retirada * f,
      deficitRenda: -l.deficitRenda * f,
    }
  })
}
