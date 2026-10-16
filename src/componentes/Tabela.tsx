import { useMemo, useState } from 'react'
import { fmtBRL } from '../engine/formatos'
import { resumoAnual } from '../engine/projecao'
import type { IdCenario, Premissas, Serie } from '../engine/types'
import type { Visao } from './dados'
import { Segmentado } from './ui'

interface Props {
  p: Premissas
  series: Record<IdCenario, Serie>
  v: Visao
}

export function Tabela({ p, series, v }: Props) {
  const [id, setId] = useState<IdCenario>('base')
  const linhas = useMemo(() => resumoAnual(p, series[id]), [p, series, id])
  const soRendaPassiva = p.estrategiaPosParar === 'renda_passiva'
  const temFases = p.fluxosPosParar.length > 0
  const temReserva = p.reservaEmergencia.ativa
  const f = (l: { defl: number }) => (v.real ? 1 / l.defl : 1)
  const rend = (l: { rendimento: number; rendimentoReal: number }) => (v.real ? l.rendimentoReal : l.rendimento)

  const exportar = () => {
    const cabBase = ['Idade', 'Ano', 'Patrimônio investido', 'Aportes nos investimentos']
    if (temReserva) cabBase.push('Reserva de emergência', 'Aportes na reserva')
    if (temFases) cabBase.push('Rendas programadas', 'Despesas programadas')
    cabBase.push('Rendimento no ano')
    const cab = soRendaPassiva
      ? [...cabBase, 'Renda passiva gerada', 'Renda passiva usada', 'Déficit não coberto', 'Compras e manutenção']
      : [...cabBase, 'Retiradas no ano', 'Compras e manutenção']
    const num = (n: number) => n.toFixed(2).replace('.', ',')
    const corpo = linhas.map((l) => {
      const base = [Math.round(l.idade), l.ano, num(v.real ? l.patReal : l.patNominal), num(l.aporte * f(l))]
      if (temReserva) base.push(num(l.reservaEmergencia * f(l)), num(l.aporteReserva * f(l)))
      if (temFases) base.push(num(l.rendaProgramada * f(l)), num(l.despesaProgramada * f(l)))
      base.push(num(rend(l)))
      const posParar = soRendaPassiva
        ? [num(l.rendaPassiva * f(l)), num(l.retirada * f(l)), num(l.deficitRenda * f(l))]
        : [num(l.retirada * f(l))]
      return [...base, ...posParar, num(l.compra * f(l))].join(';')
    })
    const csv = '﻿' + [cab.join(';'), ...corpo].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `horizonte-${id}-${v.real ? 'real' : 'nominal'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <details id="tabela-dados" className="cartao tabela">
      <summary>Tabela ano a ano</summary>
      <div className="tabela-barra">
        <Segmentado
          rotulo="Cenário da tabela"
          valor={id}
          onChange={setId}
          opcoes={[
            { id: 'pessimista', nome: 'Pessimista' },
            { id: 'base', nome: 'Base' },
            { id: 'otimista', nome: 'Otimista' },
          ]}
        />
        <button type="button" className="btn" onClick={exportar}>
          Baixar CSV
        </button>
      </div>
      <p className="ajuda">
        {v.real ? 'Valores em R$ de hoje.' : 'Valores nominais (futuros).'}{' '}
        {soRendaPassiva && 'O déficit não coberto não é retirado do principal.'}
        {temFases && ' Rendas e despesas programadas mostram apenas as fases temporárias.'}
        {temReserva && ' A reserva é exibida separadamente e não compõe o patrimônio investido.'}
      </p>
      <div className="tabela-rolagem">
        <table>
          <caption className="sr-only">Projeção financeira ano a ano do cenário selecionado</caption>
          <thead>
            <tr>
              <th>Idade</th>
              <th>Ano</th>
              <th>Patrimônio investido</th>
              <th>Aportes nos investimentos</th>
              {temReserva && (
                <>
                  <th>Reserva de emergência</th>
                  <th>Aportes na reserva</th>
                </>
              )}
              {temFases && (
                <>
                  <th>Rendas programadas</th>
                  <th>Despesas programadas</th>
                </>
              )}
              <th>Rendimento</th>
              {soRendaPassiva ? (
                <>
                  <th>Renda passiva gerada</th>
                  <th>Renda passiva usada</th>
                  <th>Déficit não coberto</th>
                </>
              ) : <th>Retiradas</th>}
              <th>Compras e manutenção</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.ano} className={l.idade === p.idadeParar ? 'marca' : ''}>
                <td>{Math.round(l.idade)}</td>
                <td>{l.ano}</td>
                <td>{fmtBRL(v.real ? l.patReal : l.patNominal)}</td>
                <td>{fmtBRL(l.aporte * f(l))}</td>
                {temReserva && (
                  <>
                    <td>{fmtBRL(l.reservaEmergencia * f(l))}</td>
                    <td>{fmtBRL(l.aporteReserva * f(l))}</td>
                  </>
                )}
                {temFases && (
                  <>
                    <td>{fmtBRL(l.rendaProgramada * f(l))}</td>
                    <td>{fmtBRL(l.despesaProgramada * f(l))}</td>
                  </>
                )}
                <td>{fmtBRL(rend(l))}</td>
                {soRendaPassiva ? (
                  <>
                    <td>{fmtBRL(l.rendaPassiva * f(l))}</td>
                    <td>{fmtBRL(l.retirada * f(l))}</td>
                    <td>{fmtBRL(l.deficitRenda * f(l))}</td>
                  </>
                ) : <td>{fmtBRL(l.retirada * f(l))}</td>}
                <td>{fmtBRL(l.compra * f(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
