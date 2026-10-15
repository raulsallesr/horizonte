import type { ReactNode } from 'react'
import { fmtBRL, fmtBRLCompacto, fmtFracao, fmtIdade, fmtMeses } from '../engine/formatos'
import { numeroLiberdade, patrimonioNaIdade, rendaSustentavelReal, type ImpactoBarco } from '../engine/metas'
import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import { deflatorMes } from '../engine/projecao'
import type { IdCenario, Premissas, Serie } from '../engine/types'
import type { Visao } from './dados'

const ORDEM: IdCenario[] = ['pessimista', 'base', 'otimista']

function Kpi({ rotulo, valor, sub, tom }: { rotulo: string; valor: ReactNode; sub?: ReactNode; tom?: string }) {
  return (
    <div className={`kpi ${tom ?? ''}`}>
      <span className="kpi-rotulo">{rotulo}</span>
      <strong className="kpi-valor">{valor}</strong>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  )
}

interface Props {
  p: Premissas
  series: Record<IdCenario, Serie>
  libs: Record<IdCenario, number | null>
  impactos: Record<IdCenario, ImpactoBarco> | null
  mc: ResultadoMonteCarlo | null
  v: Visao
}

export function Kpis({ p, series, libs, impactos, mc, v }: Props) {
  const base = series.base
  const libBase = libs.base
  const anoDe = (idade: number) => p.anoBase + Math.round(idade - p.idadeAtual)

  const defParar = v.real ? 1 : deflatorMes(p, Math.round((p.idadeParar - p.idadeAtual) * 12))
  const patParar = patrimonioNaIdade(p, base, p.idadeParar, v.real)
  const mult = v.periodo === 'mensal' ? 1 : 12
  const renda = rendaSustentavelReal(p, base, p.idadeParar) * defParar * mult
  const despesa = p.despesaMensal * defParar * mult
  const unidade = v.periodo === 'mensal' ? '/mês' : '/ano'

  let subLib: ReactNode = `Não é atingida até os ${p.idadeFinal} anos neste cenário.`
  let tomLib = 'alerta'
  if (libBase !== null) {
    const dif = Math.round((p.idadeParar - libBase) * 12)
    tomLib = dif >= 0 ? 'ok' : 'atencao'
    subLib =
      dif >= 0
        ? `em ${anoDe(libBase)} · ${fmtMeses(dif)} antes de parar de trabalhar`
        : `em ${anoDe(libBase)} · ${fmtMeses(-dif)} depois da idade escolhida para parar`
  }

  const imp = impactos?.base
  return (
    <div className="kpis">
      <Kpi rotulo="🏝️ Liberdade financeira (Base)" valor={libBase !== null ? fmtIdade(libBase) : '—'} sub={subLib} tom={tomLib} />
      <Kpi
        rotulo={`Chance de ter a liberdade até os ${p.idadeParar}`}
        valor={mc ? fmtFracao(mc.probLiberdadeAteParar) : '…'}
        sub="considerando a oscilação dos mercados"
      />
      <Kpi
        rotulo={`Chance do dinheiro durar até os ${p.idadeFinal}`}
        valor={mc ? fmtFracao(mc.probDura) : '…'}
        sub="sem zerar o patrimônio na fase de saque"
      />
      <Kpi
        rotulo={`Patrimônio aos ${p.idadeParar}`}
        valor={fmtBRLCompacto(patParar)}
        sub={`${v.real ? 'em R$ de hoje' : 'valor nominal futuro'} · número da liberdade: ${fmtBRLCompacto(numeroLiberdade(p) * (v.real ? 1 : defParar))}`}
      />
      <Kpi
        rotulo={`Renda passiva sustentável${unidade}`}
        valor={fmtBRL(renda)}
        sub={`aos ${p.idadeParar} anos, a ${p.taxaRetirada.toLocaleString('pt-BR')}% a.a. · despesa desejada ${fmtBRL(despesa)}${unidade}`}
        tom={renda >= despesa ? 'ok' : 'atencao'}
      />
      {p.barco.ativo ? (
        <Kpi
          rotulo={`⛵ ${p.barco.nome || 'Barco'}`}
          valor={`aos ${p.barco.idade} anos`}
          sub={
            imp?.atrasoMeses != null
              ? imp.atrasoMeses === 0
                ? `em ${anoDe(p.barco.idade)} · não atrasa a liberdade`
                : `em ${anoDe(p.barco.idade)} · adia a liberdade em ${fmtMeses(imp.atrasoMeses)}`
              : `em ${anoDe(p.barco.idade)}`
          }
        />
      ) : (
        <Kpi rotulo="⛵ Barco" valor="desligado" sub="ative em “Meta: o barco” no painel" />
      )}
    </div>
  )
}

export function Metas({ p, libs, impactos }: { p: Premissas; libs: Record<IdCenario, number | null>; impactos: Record<IdCenario, ImpactoBarco> | null }) {
  const numero = numeroLiberdade(p)
  const progresso = Math.min(1, p.patrimonioInicial / numero)
  const anoDe = (idade: number) => p.anoBase + Math.round(idade - p.idadeAtual)
  const custoNaCompra = p.barco.valor * deflatorMes(p, Math.round((p.barco.idade - p.idadeAtual) * 12))
  const manutencaoAno = (p.barco.valor * p.barco.manutencaoPct) / 100

  return (
    <div className="metas">
      <section className="cartao meta">
        <h3>🏝️ Meta 1 · Liberdade financeira</h3>
        <p className="meta-num">{fmtBRLCompacto(numero)}</p>
        <p className="meta-legenda">
          para viver com {fmtBRL(p.despesaMensal)}/mês
          {p.outraRendaPosParar > 0 && ` (+ ${fmtBRL(p.outraRendaPosParar)} de outra renda)`} · em R$ de hoje
        </p>
        <div className="barra" role="progressbar" aria-valuenow={Math.round(progresso * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso até a liberdade">
          <span style={{ width: `${Math.max(1, progresso * 100)}%` }} />
        </div>
        <p className="meta-legenda">Você já tem {fmtFracao(progresso)} do caminho hoje.</p>
        <ul className="chips">
          {ORDEM.map((id) => (
            <li key={id} className={`chip cen-${id}`}>
              <span>{p.cenarios[id].nome}</span>
              <b>{libs[id] !== null ? `${Math.round(libs[id]!)} anos · ${anoDe(libs[id]!)}` : 'não atinge'}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="cartao meta">
        <h3>⛵ Meta 2 · {p.barco.nome || 'O barco'}</h3>
        {p.barco.ativo ? (
          <>
            <p className="meta-num">{fmtBRLCompacto(p.barco.valor)}</p>
            <p className="meta-legenda">
              aos {p.barco.idade} anos ({anoDe(p.barco.idade)}) · {fmtBRLCompacto(custoNaCompra)} em valores da época ·{' '}
              {p.barco.modo === 'caixinha' ? `caixinha de ${fmtBRL(p.barco.caixinhaMensal)}/mês` : 'à vista do patrimônio'}
            </p>
            <p className="meta-legenda">
              Mantê-lo custa ≈ {fmtBRL(manutencaoAno)}/ano ({fmtBRL(manutencaoAno / 12)}/mês) em R$ de hoje.
            </p>
            <ul className="chips">
              {ORDEM.map((id) => {
                const im = impactos?.[id]
                return (
                  <li key={id} className={`chip cen-${id}`}>
                    <span>{p.cenarios[id].nome}</span>
                    <b>{im?.atrasoMeses == null ? '—' : im.atrasoMeses === 0 ? 'sem atraso' : `adia ${fmtMeses(im.atrasoMeses)}`}</b>
                  </li>
                )
              })}
            </ul>
            <p className="meta-legenda">Quanto o barco adia a data da liberdade, em cada cenário.</p>
          </>
        ) : (
          <p className="meta-legenda">Ligue o barco no painel para ver o impacto dele na sua liberdade.</p>
        )}
      </section>
    </div>
  )
}
