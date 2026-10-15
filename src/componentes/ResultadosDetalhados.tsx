import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import type { IdCenario, Premissas, Serie } from '../engine/types'
import { GraficoFluxo, GraficoLeque, GraficoPatrimonio, GraficoProbabilidade } from './Graficos'
import { Tabela } from './Tabela'
import type { Visao } from './dados'

interface Props {
  p: Premissas
  series: Record<IdCenario, Serie>
  v: Visao
  libs: Record<IdCenario, number | null>
  virada: number | null
  mc: ResultadoMonteCarlo | null
  calculando: boolean
}

export default function ResultadosDetalhados({ p, series, v, libs, virada, mc, calculando }: Props) {
  return (
    <>
      <GraficoPatrimonio p={p} series={series} v={v} idadeLiberdadeBase={libs.base} />
      <GraficoFluxo p={p} serieBase={series.base} v={v} idadeVirada={virada} />
      <GraficoLeque p={p} mc={mc} calculando={calculando} v={v} />
      <GraficoProbabilidade p={p} mc={mc} calculando={calculando} v={v} />
      <Tabela p={p} series={series} v={v} />
    </>
  )
}
