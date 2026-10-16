import type { ReactNode } from 'react'
import { fmtBRL, fmtBRLCompacto, fmtFracao, fmtIdade, fmtMeses } from '../engine/formatos'
import { deficitMetaReal, numeroLiberdade, patrimonioNaIdade, rendaDoPatrimonioReal, resultadoMeta, taxaRendaObjetivo, type ImpactoBarco } from '../engine/metas'
import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import { deflatorMes } from '../engine/projecao'
import type { IdCenario, Premissas, Serie } from '../engine/types'
import type { Visao } from './dados'
import { Icone } from './ui'

const ORDEM: IdCenario[] = ['pessimista', 'base', 'otimista']

function Kpi({ rotulo, valor, sub, tom }: { rotulo: ReactNode; valor: ReactNode; sub?: ReactNode; tom?: string }) {
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
  mcIndisponivel: boolean
  v: Visao
}

export function Kpis({ p, series, libs, impactos, mc, mcIndisponivel, v }: Props) {
  const base = series.base
  const libBase = libs.base
  const anoDe = (idade: number) => p.anoBase + Math.round(idade - p.idadeAtual)

  const defParar = v.real ? 1 : deflatorMes(p, Math.round((p.idadeParar - p.idadeAtual) * 12))
  const patParar = patrimonioNaIdade(p, base, p.idadeParar, v.real)
  const mult = v.periodo === 'mensal' ? 1 : 12
  const renda = rendaDoPatrimonioReal(p, base, p.idadeParar) * defParar * mult
  const necessidade = Math.max(0, p.despesaMensal - p.outraRendaPosParar) * defParar * mult
  const unidade = v.periodo === 'mensal' ? '/mês' : '/ano'
  const soRendaPassiva = p.estrategiaPosParar === 'renda_passiva'

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
  const metaBarco = resultadoMeta(base, p.barco.id)
  const valorMc = (valor: number | undefined) =>
    valor !== undefined ? fmtFracao(valor) : mcIndisponivel ? 'indisponível' : '…'
  const subMc = (texto: string) => mcIndisponivel ? 'simulação de probabilidades indisponível' : mc ? texto : 'recalculando probabilidades…'
  return (
    <div className="kpis">
      <Kpi rotulo={<><Icone nome="liberdade" /> Liberdade financeira (Base)</>} valor={libBase !== null ? fmtIdade(libBase) : '—'} sub={subLib} tom={tomLib} />
      <Kpi
        rotulo={`Chance de ter a liberdade até os ${p.idadeParar}`}
        valor={valorMc(mc?.probLiberdadeAteParar)}
        sub={subMc('considerando a oscilação dos mercados')}
      />
      <Kpi
        rotulo={soRendaPassiva
          ? `Chance de viver só da renda até os ${p.idadeFinal}`
          : `Chance do dinheiro durar até os ${p.idadeFinal}`}
        valor={valorMc(mc?.probDura)}
        sub={subMc(soRendaPassiva
          ? 'sem vender o principal para cobrir despesas; metas continuam avaliadas separadamente'
          : 'sem zerar o patrimônio na fase de retirada; metas sem saldo não são compradas')}
      />
      <Kpi
        rotulo={`Patrimônio aos ${p.idadeParar}`}
        valor={fmtBRLCompacto(patParar)}
        sub={`${v.real ? 'em R$ de hoje' : 'valor nominal futuro'} · patrimônio-alvo: ${fmtBRLCompacto(numeroLiberdade(p) * (v.real ? 1 : defParar))}`}
      />
      <Kpi
        rotulo={`${soRendaPassiva ? 'Renda passiva disponível' : 'Retirada sustentável'}${unidade}`}
        valor={fmtBRL(renda)}
        sub={soRendaPassiva
          ? `aos ${p.idadeParar} anos, renda líquida de ${taxaRendaObjetivo(p).toLocaleString('pt-BR')}% a.a. · precisa cobrir ${fmtBRL(necessidade)}${unidade}; o excedente é reinvestido`
          : `aos ${p.idadeParar} anos, taxa de ${taxaRendaObjetivo(p).toLocaleString('pt-BR')}% a.a. · precisa cobrir ${fmtBRL(necessidade)}${unidade}`}
        tom={renda >= necessidade ? 'ok' : 'atencao'}
      />
      {p.barco.ativo && metaBarco?.status === 'sem_recursos' ? (
        <Kpi
          rotulo={<><Icone nome="barco" /> {p.barco.nome || 'Barco'}</>}
          valor="meta não financiada"
          sub={`faltariam ${fmtBRLCompacto(deficitMetaReal(metaBarco))} aos ${p.barco.idade} anos no cenário Base`}
          tom="alerta"
        />
      ) : p.barco.ativo ? (
        <Kpi
          rotulo={<><Icone nome="barco" /> {p.barco.nome || 'Barco'}</>}
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
        <Kpi rotulo={<><Icone nome="barco" /> Barco</>} valor="desligado" sub="ative em “Meta: o barco” no painel" />
      )}
    </div>
  )
}

export function Metas({
  p,
  series,
  libs,
  impactos,
  mc,
}: {
  p: Premissas
  series: Record<IdCenario, Serie>
  libs: Record<IdCenario, number | null>
  impactos: Record<IdCenario, ImpactoBarco> | null
  mc: ResultadoMonteCarlo | null
}) {
  const numero = numeroLiberdade(p)
  const soRendaPassiva = p.estrategiaPosParar === 'renda_passiva'
  const progresso = numero <= 0 ? 1 : Math.min(1, p.patrimonioInicial / numero)
  const anoDe = (idade: number) => p.anoBase + Math.round(idade - p.idadeAtual)
  const custoNaCompra = p.barco.valor * deflatorMes(p, Math.round((p.barco.idade - p.idadeAtual) * 12))
  const manutencaoAno = (p.barco.valor * p.barco.manutencaoPct) / 100

  const pendentes = series.base.metas.filter((meta) => meta.status !== 'realizada')

  return (
    <>
    <div className="metas">
      <section className="cartao meta">
        <h3><Icone nome="liberdade" /> Meta 1 · Liberdade financeira</h3>
        <p className="meta-num">{fmtBRLCompacto(numero)}</p>
        <p className="meta-legenda">
          {soRendaPassiva ? 'para viver só da renda do patrimônio' : 'para sustentar retiradas planejadas'} com despesa de {fmtBRL(p.despesaMensal)}/mês
          {p.outraRendaPosParar > 0 && ` e ${fmtBRL(p.outraRendaPosParar)}/mês de outra renda`} · em R$ de hoje
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
        <h3><Icone nome="barco" /> Meta 2 · {p.barco.nome || 'O barco'}</h3>
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
            {mc && (
              <p className="meta-legenda destaque-probabilidade">
                Chance simulada de conseguir comprar na idade planejada: <strong>{fmtFracao(mc.probMetas[p.barco.id] ?? 0)}</strong>.
              </p>
            )}
            <ul className="chips">
              {ORDEM.map((id) => {
                const im = impactos?.[id]
                const meta = resultadoMeta(series[id], p.barco.id)
                return (
                  <li key={id} className={`chip cen-${id}`}>
                    <span>{p.cenarios[id].nome}</span>
                    <b>
                      {meta?.status === 'sem_recursos'
                        ? `faltam ${fmtBRLCompacto(deficitMetaReal(meta))}`
                        : im?.atrasoMeses == null
                          ? '—'
                          : im.atrasoMeses === 0
                            ? 'sem atraso'
                            : `adia ${fmtMeses(im.atrasoMeses)}`}
                    </b>
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
    {pendentes.length > 0 && (
      <section className="alerta-metas" role="status" aria-label="Metas não realizadas no cenário Base">
        <div>
          <h3>Metas que não cabem no plano Base</h3>
          <p>A compra não é simulada quando falta saldo; nenhuma dívida é criada silenciosamente.</p>
        </div>
        <ul>
          {pendentes.map((meta) => (
            <li key={meta.id}>
              <strong>{meta.nome || 'Meta'}</strong> aos {meta.idade} anos: {meta.status === 'sem_recursos'
                ? `faltam ${fmtBRLCompacto(deficitMetaReal(meta))} em R$ de hoje.`
                : 'a data está fora do horizonte da projeção.'}
            </li>
          ))}
        </ul>
      </section>
    )}
    </>
  )
}
