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
  const f = (l: { defl: number }) => (v.real ? 1 / l.defl : 1)
  const rend = (l: { rendimento: number; rendimentoReal: number }) => (v.real ? l.rendimentoReal : l.rendimento)

  const exportar = () => {
    const cab = ['Idade', 'Ano', 'Patrimônio', 'Aportes no ano', 'Rendimento no ano', 'Retiradas no ano', 'Compras e manutenção']
    const num = (n: number) => n.toFixed(2).replace('.', ',')
    const corpo = linhas.map((l) =>
      [Math.round(l.idade), l.ano, num(v.real ? l.patReal : l.patNominal), num(l.aporte * f(l)), num(rend(l)), num(l.retirada * f(l)), num(l.compra * f(l))].join(';'),
    )
    const csv = '﻿' + [cab.join(';'), ...corpo].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `horizonte-${id}-${v.real ? 'real' : 'nominal'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <details className="cartao tabela">
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
      <p className="ajuda">{v.real ? 'Valores em R$ de hoje.' : 'Valores nominais (futuros).'}</p>
      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr>
              <th>Idade</th>
              <th>Ano</th>
              <th>Patrimônio</th>
              <th>Aportes</th>
              <th>Rendimento</th>
              <th>Retiradas</th>
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
                <td>{fmtBRL(rend(l))}</td>
                <td>{fmtBRL(l.retirada * f(l))}</td>
                <td>{fmtBRL(l.compra * f(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
