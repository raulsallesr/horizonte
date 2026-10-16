import { useState, type ReactNode } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtBRL, fmtBRLCompacto } from '../engine/formatos'
import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import type { IdCenario, Premissas, Serie } from '../engine/types'
import {
  dadosFluxo,
  dadosLeque,
  dadosPatrimonio,
  xDe,
  type PontoFluxo,
  type PontoLeque,
  type PontoPatrimonio,
  type Visao,
} from './dados'

/** Arredonda para cima até um número "redondo" (1, 2, 2,5, 5 ou 10 × 10^k) — eixos arrumados. */
function redondoCima(v: number): number {
  if (!(v > 0)) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const m = v / exp
  const passo = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10
  return passo * exp
}

const COR: Record<IdCenario, string> = {
  pessimista: 'var(--c-pess)',
  base: 'var(--c-base)',
  otimista: 'var(--c-otim)',
}

interface TooltipProps {
  active?: boolean
  payload?: { name?: string; value?: number | [number, number]; color?: string; dataKey?: string; payload?: { idade: number } }[]
  p: Premissas
  v: Visao
  fmt?: (n: number) => string
  esconder?: string[]
}

function TooltipFino({ active, payload, p, v, fmt = fmtBRL, esconder = [] }: TooltipProps) {
  if (!active || !payload?.length) return null
  const idade = payload[0].payload?.idade ?? 0
  const ano = p.anoBase + Math.round(idade - p.idadeAtual)
  return (
    <div className="tip">
      <strong>
        {Math.round(idade)} anos · {ano}
      </strong>
      {payload
        .filter((x) => typeof x.value === 'number' && !esconder.includes(String(x.dataKey)))
        .map((x) => (
          <div key={String(x.dataKey)} className="tip-linha">
            <span className="bolinha" style={{ background: x.color }} />
            <span>{x.name}</span>
            <b>{fmt(x.value as number)}</b>
          </div>
        ))}
      <em>{v.real ? "valores em R$ de hoje" : 'valores nominais (futuros)'}</em>
    </div>
  )
}

function Eixos({ v }: { v: Visao }) {
  return (
    <>
      <CartesianGrid stroke="var(--borda)" strokeDasharray="3 4" vertical={false} />
      <XAxis
        dataKey="x"
        type="number"
        domain={['dataMin', 'dataMax']}
        tick={{ fill: 'var(--muted)', fontSize: 12 }}
        stroke="var(--borda)"
        tickFormatter={(x: number) => String(Math.round(x))}
        label={{ value: v.eixo === 'idade' ? 'idade' : 'ano', position: 'insideBottomRight', offset: -2, fill: 'var(--muted)', fontSize: 11 }}
      />
    </>
  )
}

const marcador = (x: number, texto: string, cor: string, pos: 'top' | 'insideTopLeft' = 'insideTopLeft') => (
  <ReferenceLine
    x={x}
    stroke={cor}
    strokeDasharray="4 3"
    label={{ value: texto, position: pos, fill: cor, fontSize: 11 }}
  />
)

function EscalaToggle({ completo, onChange }: { completo: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="escala">
      <input type="checkbox" checked={completo} onChange={(e) => onChange(e.target.checked)} /> ver escala completa (sem cortar o topo)
    </label>
  )
}

export function Cartao({ titulo, sub, resumo, children }: { titulo: string; sub?: string; resumo?: string; children: ReactNode }) {
  return (
    <section className="cartao grafico">
      <header>
        <h3>{titulo}</h3>
        {sub && <p>{sub}</p>}
      </header>
      {resumo && <p className="sr-only">{resumo} Os mesmos valores podem ser consultados na tabela ano a ano.</p>}
      {children}
    </section>
  )
}

interface PropsPatrimonio {
  p: Premissas
  series: Record<IdCenario, Serie>
  v: Visao
  idadeLiberdadeBase: number | null
}

export function GraficoPatrimonio({ p, series, v, idadeLiberdadeBase }: PropsPatrimonio) {
  const [completo, setCompleto] = useState(false)
  const dados: PontoPatrimonio[] = dadosPatrimonio(p, series, v)
  // foco no caminho até a liberdade: corta o topo, onde a curva explode em idades avançadas
  const iRef = Math.min(dados.length - 1, Math.round(p.idadeParar - p.idadeAtual) + 5)
  const topo = redondoCima(Math.max(dados[iRef].otimista, dados[iRef].meta * 1.5) * 1.25)
  const pontoParar = dados[Math.min(dados.length - 1, Math.max(0, Math.round(p.idadeParar - p.idadeAtual)))]
  const resumo = `Patrimônio no cenário Base aos ${p.idadeParar} anos: ${fmtBRLCompacto(pontoParar.base)}. ${idadeLiberdadeBase === null ? 'A liberdade não é sustentada dentro do horizonte.' : `A liberdade passa a ser sustentada aos ${Math.round(idadeLiberdadeBase)} anos.`}`
  return (
    <Cartao
      titulo="Seu patrimônio ao longo da vida"
      sub={`Três cenários de rentabilidade. A linha tracejada amarela é o número da liberdade${v.real ? '' : ' (corrigido pela inflação)'}.`}
      resumo={resumo}
    >
      <EscalaToggle completo={completo} onChange={setCompleto} />
      <div className="alt-grande" role="img" aria-label={resumo}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 18, right: 16, left: 4, bottom: 8 }}>
            <Eixos v={v} />
            <YAxis
              domain={completo ? [0, 'auto'] : [0, topo]}
              allowDataOverflow={!completo}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              stroke="var(--borda)"
              width={74}
              tickFormatter={fmtBRLCompacto}
            />
            <Tooltip content={<TooltipFino p={p} v={v} esconder={[]} />} />
            <Line name="Meta de liberdade" dataKey="meta" stroke="var(--c-sol)" strokeDasharray="6 5" dot={false} strokeWidth={1.6} isAnimationActive={false} />
            <Line name="Pessimista" dataKey="pessimista" stroke={COR.pessimista} strokeWidth={2} strokeDasharray="2 3" dot={false} />
            <Line name="Otimista" dataKey="otimista" stroke={COR.otimista} strokeWidth={2} dot={false} />
            <Line name="Base" dataKey="base" stroke={COR.base} strokeWidth={3.2} dot={false} />
            {marcador(xDe(p, v, p.idadeParar), 'para de trabalhar', 'var(--muted)')}
            {p.barco.ativo && p.barco.idade < p.idadeFinal && marcador(xDe(p, v, p.barco.idade), 'barco', 'var(--c-barco)')}
            {idadeLiberdadeBase !== null && marcador(xDe(p, v, idadeLiberdadeBase), 'liberdade', 'var(--c-sol)', 'top')}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Legenda
        itens={[
          ['Pessimista', COR.pessimista],
          ['Base', COR.base],
          ['Otimista', COR.otimista],
        ]}
      />
    </Cartao>
  )
}

function Legenda({ itens }: { itens: [string, string][] }) {
  return (
    <ul className="legenda">
      {itens.map(([n, c]) => (
        <li key={n}>
          <span className="bolinha" style={{ background: c }} />
          {n}
        </li>
      ))}
    </ul>
  )
}

interface PropsFluxo {
  p: Premissas
  serieBase: Serie
  v: Visao
  idadeVirada: number | null
}

export function GraficoFluxo({ p, serieBase, v, idadeVirada }: PropsFluxo) {
  const [completo, setCompleto] = useState(false)
  const dados: PontoFluxo[] = dadosFluxo(p, serieBase, v)
  const janela = dados.filter((d) => d.idade <= p.idadeParar + 5)
  const topo = redondoCima(Math.max(1, ...janela.map((d) => d.aporte + d.rendimento)) * 1.2)
  const fundo = -redondoCima(Math.max(0, ...dados.map((d) => -d.retirada - d.deficitRenda))) * (dados.some((d) => d.retirada < 0 || d.deficitRenda < 0) ? 1 : 0)
  const unidade = v.periodo === 'mensal' ? 'por mês (média do ano)' : 'por ano'
  const soRendaPassiva = p.estrategiaPosParar === 'renda_passiva'
  const resumo = idadeVirada === null
    ? 'O rendimento real não supera os aportes dentro do horizonte projetado.'
    : `O rendimento real passa a superar os aportes por volta dos ${Math.round(idadeVirada)} anos.`
  return (
    <Cartao
      titulo="Quanto o dinheiro rende — e quanto você aporta"
      sub={`Cenário Base, ${unidade}${v.real ? ', em R$ de hoje e já descontada a inflação' : ''}. Quando a barra amarela passa a verde, o dinheiro trabalha mais do que você.${soRendaPassiva ? ' Déficits não cobertos não são retirados do principal.' : ''}`}
      resumo={resumo}
    >
      <EscalaToggle completo={completo} onChange={setCompleto} />
      <div className="alt-medio" role="img" aria-label={resumo}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 18, right: 16, left: 4, bottom: 8 }} stackOffset="sign">
            <Eixos v={v} />
            <YAxis domain={completo ? ['auto', 'auto'] : [fundo, topo]} allowDataOverflow={!completo} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--borda)" width={74} tickFormatter={fmtBRLCompacto} />
            <Tooltip content={<TooltipFino p={p} v={v} />} cursor={{ fill: 'var(--hover)' }} />
            <ReferenceLine y={0} stroke="var(--borda)" />
            <Bar name="Aporte" dataKey="aporte" stackId="f" fill="var(--c-aporte)" isAnimationActive={false} />
            <Bar name="Rendimento" dataKey="rendimento" stackId="f" fill="var(--c-sol)" isAnimationActive={false} />
            <Bar name={soRendaPassiva ? 'Renda usada' : 'Retirada'} dataKey="retirada" stackId="f" fill="var(--c-pess)" isAnimationActive={false} />
            {soRendaPassiva && <Bar name="Déficit não coberto" dataKey="deficitRenda" stackId="f" fill="var(--atencao)" isAnimationActive={false} />}
            {idadeVirada !== null && marcador(xDe(p, v, idadeVirada), 'rendimento > aporte', 'var(--c-sol)')}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Legenda
        itens={[
          ['Aporte', 'var(--c-aporte)'],
          ['Rendimento', 'var(--c-sol)'],
          [soRendaPassiva ? 'Renda passiva usada' : 'Retirada (depois de parar)', 'var(--c-pess)'],
          ...(soRendaPassiva ? [['Déficit não coberto', 'var(--atencao)'] as [string, string]] : []),
        ]}
      />
    </Cartao>
  )
}

interface PropsLeque {
  p: Premissas
  mc: ResultadoMonteCarlo | null
  calculando: boolean
  v: Visao
}

export function GraficoLeque({ p, mc, calculando, v }: PropsLeque) {
  const [completo, setCompleto] = useState(false)
  const dados: PontoLeque[] = mc ? dadosLeque(p, mc, v) : []
  const iRef = Math.min(dados.length - 1, Math.round(p.idadeParar - p.idadeAtual) + 5)
  const topo = dados.length ? redondoCima(Math.max(dados[iRef].p90, dados[iRef].meta * 1.5) * 1.25) : 0
  const pontoParar = dados[Math.min(dados.length - 1, Math.max(0, Math.round(p.idadeParar - p.idadeAtual)))]
  const resumo = pontoParar
    ? `Aos ${p.idadeParar} anos, 80% das trajetórias ficam entre ${fmtBRLCompacto(pontoParar.p10)} e ${fmtBRLCompacto(pontoParar.p90)}, com mediana de ${fmtBRLCompacto(pontoParar.p50)}.`
    : 'A simulação de probabilidades ainda está sendo calculada.'
  return (
    <Cartao
      titulo="E se os mercados oscilarem? (simulação de probabilidades)"
      sub={`${mc ? mc.trajetorias.toLocaleString('pt-BR') : '5.000'} futuros possíveis no cenário Base. Faixa clara = 80% dos casos (do 10º ao 90º percentil); linha = mediana.`}
      resumo={resumo}
    >
      <EscalaToggle completo={completo} onChange={setCompleto} />
      <div className="alt-medio carregando-wrap" role="img" aria-label={resumo}>
        {calculando && <span className="calculando">calculando…</span>}
        {mc && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 18, right: 16, left: 4, bottom: 8 }}>
              <Eixos v={v} />
              <YAxis domain={completo ? [0, 'auto'] : [0, topo]} allowDataOverflow={!completo} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--borda)" width={74} tickFormatter={fmtBRLCompacto} />
              <Tooltip content={<TooltipFino p={p} v={v} esconder={['faixa', 'meta', 'prob']} />} />
              <Area name="Faixa 10%–90%" dataKey="faixa" stroke="none" fill="var(--c-base)" fillOpacity={0.2} isAnimationActive={false} />
              <Line name="Pessimista (10%)" dataKey="p10" stroke="var(--c-pess)" strokeWidth={1.2} dot={false} isAnimationActive={false} />
              <Line name="Otimista (90%)" dataKey="p90" stroke="var(--c-otim)" strokeWidth={1.2} dot={false} isAnimationActive={false} />
              <Line name="Mediana" dataKey="p50" stroke="var(--c-base)" strokeWidth={2.8} dot={false} isAnimationActive={false} />
              <Line name="Meta de liberdade" dataKey="meta" stroke="var(--c-sol)" strokeDasharray="6 5" dot={false} strokeWidth={1.6} isAnimationActive={false} />
              {marcador(xDe(p, v, p.idadeParar), 'para de trabalhar', 'var(--muted)')}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Cartao>
  )
}

export function GraficoProbabilidade({ p, mc, calculando, v }: PropsLeque) {
  const dados: PontoLeque[] = mc ? dadosLeque(p, mc, v) : []
  const pontoParar = dados[Math.min(dados.length - 1, Math.max(0, Math.round(p.idadeParar - p.idadeAtual)))]
  const resumo = pontoParar
    ? `A chance simulada de já sustentar a liberdade aos ${p.idadeParar} anos é de ${Math.round(pontoParar.prob)}%.`
    : 'A chance de liberdade ainda está sendo calculada.'
  return (
    <Cartao
      titulo="Chance de já ter a liberdade, idade por idade"
      sub="Em quantos dos futuros simulados o patrimônio já passou do número da liberdade até cada idade."
      resumo={resumo}
    >
      <div className="alt-pequeno carregando-wrap" role="img" aria-label={resumo}>
        {calculando && <span className="calculando">calculando…</span>}
        {mc && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
              <Eixos v={v} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--borda)" width={74} tickFormatter={(n: number) => `${n}%`} />
              <Tooltip content={<TooltipFino p={p} v={v} fmt={(n) => `${Math.round(n)}%`} />} />
              <Area name="Chance acumulada" dataKey="prob" stroke="var(--c-sol)" strokeWidth={2.4} fill="var(--c-sol)" fillOpacity={0.18} isAnimationActive={false} />
              {marcador(xDe(p, v, p.idadeParar), 'para de trabalhar', 'var(--muted)')}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Cartao>
  )
}
