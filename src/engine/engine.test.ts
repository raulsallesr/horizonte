import { describe, expect, it } from 'vitest'
import { fmtIdade, fmtMeses } from './formatos'
import { idadeLiberdade, impactoBarco, numeroLiberdade } from './metas'
import { monteCarlo } from './montecarlo'
import { premissasPadrao } from './padrao'
import { projetar, resumoAnual, simular } from './projecao'
import type { Premissas } from './types'

/** Premissas "limpas": sem inflação, sem compras, sem aumento real. */
function limpa(extra: Partial<Premissas> = {}): Premissas {
  const p = premissasPadrao(2026)
  return {
    ...p,
    inflacao: 0,
    aumentoRealSalario: 0,
    decimoTerceiro: false,
    barco: { ...p.barco, ativo: false },
    extras: [],
    ...extra,
  }
}

describe('projeção determinística', () => {
  it('sem aporte e sem saque: P0 * (1+r)^n', () => {
    const p = limpa({
      patrimonioInicial: 100000,
      aporteModo: 'fixo',
      aporteFixo: 0,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 40,
      despesaMensal: 0,
    })
    const s = projetar(p, 'base')
    expect(s.pat[s.meses]).toBeCloseTo(100000 * Math.pow(1.11, 10), 4)
  })

  it('aporte fixo constante: fórmula de valor futuro de anuidade', () => {
    const p = limpa({
      patrimonioInicial: 0,
      aporteModo: 'fixo',
      aporteFixo: 1000,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 50,
    })
    const s = projetar(p, 'base')
    const rm = Math.pow(1.11, 1 / 12) - 1
    const n = 20 * 12
    const esperado = (1000 * (Math.pow(1 + rm, n) - 1)) / rm
    expect(s.pat[n]).toBeCloseTo(esperado, 4)
  })

  it('deflator: taxa real = (1+nominal)/(1+inflação)-1', () => {
    const p = limpa({
      inflacao: 5,
      patrimonioInicial: 100000,
      aporteModo: 'fixo',
      aporteFixo: 0,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 40,
      despesaMensal: 0,
    })
    const s = projetar(p, 'base')
    const real = s.pat[s.meses] / s.defl[s.meses]
    expect(real).toBeCloseTo(100000 * Math.pow(1.11 / 1.05, 10), 4)
  })

  it('aporte percentual com 13º dobra a renda de dezembro', () => {
    const p = limpa({
      aporteModo: 'percentual',
      aportePercentual: 10,
      salarioMensal: 1000,
      decimoTerceiro: true,
      patrimonioInicial: 0,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 32,
    })
    const s = projetar(p, 'base')
    expect(s.aporte[1]).toBeCloseTo(100, 6)
    expect(s.aporte[12]).toBeCloseTo(200, 6)
  })

  it('fase de saque: retira a despesa corrigida e zera o patrimônio quando acaba', () => {
    const p = limpa({
      patrimonioInicial: 120000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 90,
      despesaMensal: 5000,
      cenarios: premissasPadrao(2026).cenarios,
    })
    const s = projetar(p, 'pessimista')
    expect(s.esgotouK).toBeGreaterThan(0)
    expect(s.pat[s.meses]).toBe(0)
    expect(s.retirada[1]).toBeCloseTo(5000, 6)
  })

  it('outra renda pós-parar reduz a retirada e o número da liberdade', () => {
    const p = limpa({ despesaMensal: 5000, outraRendaPosParar: 2000, taxaRetirada: 4 })
    expect(numeroLiberdade(p)).toBeCloseTo((3000 * 12) / 0.04, 6)
  })

  it('caixinha: compra sai da caixinha e a sobra volta ao patrimônio', () => {
    const p = limpa({
      patrimonioInicial: 0,
      aporteModo: 'fixo',
      aporteFixo: 1000,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 40,
      barco: {
        ...premissasPadrao(2026).barco,
        ativo: true,
        valor: 10000,
        idade: 32,
        manutencaoPct: 0,
        modo: 'caixinha',
        caixinhaMensal: 1000,
      },
    })
    const s = projetar(p, 'base')
    const k = 24
    expect(s.compra[k]).toBeCloseTo(10000, 6)
    // todo o aporte foi para a caixinha até a compra: patrimônio = caixinha acumulada - custo
    const rm = Math.pow(1.11, 1 / 12) - 1
    const caixa = (1000 * (Math.pow(1 + rm, k - 1) - 1)) / rm // depósitos nos meses 1..k-1
    const caixaK = caixa * (1 + rm) // rendimento do mês k sobre o saldo
    // no mês da compra o aporte (1000) já entra direto no patrimônio
    expect(s.pat[k]).toBeCloseTo(caixaK - 10000 + 1000, 3)
  })

  it('conservação: variação do patrimônio = rendimento + aporte - retirada - compras', () => {
    const p = premissasPadrao(2026)
    const s = projetar(p, 'base')
    for (let k = 1; k <= s.meses; k++) {
      if (s.esgotouK === k) break
      const delta = s.pat[k] - s.pat[k - 1]
      const fluxo = s.rendimento[k] + s.aporte[k] - s.retirada[k] - s.compra[k]
      expect(delta).toBeCloseTo(fluxo, 4)
    }
  })
})

describe('metas', () => {
  it('número da liberdade = despesa anual / taxa de retirada', () => {
    const p = limpa({ despesaMensal: 5500, outraRendaPosParar: 0, taxaRetirada: 4 })
    expect(numeroLiberdade(p)).toBeCloseTo(1650000, 6)
  })

  it('persona padrão atinge a liberdade e o barco atrasa (ou não adianta) a data', () => {
    const p = premissasPadrao(2026)
    const idade = idadeLiberdade(p, 'base')
    expect(idade).not.toBeNull()
    expect(idade!).toBeGreaterThan(p.idadeAtual)
    expect(idade!).toBeLessThan(p.idadeFinal)
    const imp = impactoBarco(p, 'base')
    expect(imp.atrasoMeses).not.toBeNull()
    expect(imp.atrasoMeses!).toBeGreaterThanOrEqual(0)
  })

  it('resumo anual cobre o horizonte inteiro', () => {
    const p = premissasPadrao(2026)
    const linhas = resumoAnual(p, projetar(p, 'base'))
    expect(linhas).toHaveLength(p.idadeFinal - p.idadeAtual)
    expect(linhas[0].ano).toBe(2027)
    expect(linhas[linhas.length - 1].idade).toBe(p.idadeFinal)
  })
})

describe('Monte Carlo', () => {
  it('volatilidade zero reproduz o determinístico', () => {
    const p = premissasPadrao(2026)
    p.cenarios.base.vol = 0
    const det = projetar(p, 'base')
    const mc = monteCarlo(p, { trajetorias: 50 })
    const a = 25
    expect(mc.p50[a]).toBeCloseTo(det.pat[a * 12] / det.defl[a * 12], 2)
    expect(mc.p10[a]).toBeCloseTo(mc.p90[a], 2)
  })

  it('mesma semente = mesmo resultado; percentis ordenados', () => {
    const p = premissasPadrao(2026)
    const a = monteCarlo(p, { trajetorias: 300, semente: 7 })
    const b = monteCarlo(p, { trajetorias: 300, semente: 7 })
    expect(a).toEqual(b)
    for (let i = 0; i < a.idades.length; i++) {
      expect(a.p10[i]).toBeLessThanOrEqual(a.p50[i])
      expect(a.p50[i]).toBeLessThanOrEqual(a.p90[i])
    }
    expect(a.probLiberdade[0]).toBeGreaterThanOrEqual(0)
    expect(a.probLiberdade[a.probLiberdade.length - 1]).toBeLessThanOrEqual(1)
  })

  it('caminho rápido (detalhe=false) bate com o completo no patrimônio', () => {
    const p = premissasPadrao(2026)
    const cen = p.cenarios.base
    const cheio = simular(p, cen)
    const leve = simular(p, cen, { detalhe: false })
    expect(Array.from(leve.pat)).toEqual(Array.from(cheio.pat))
  })
})

describe('rendimento real', () => {
  it('variação do patrimônio real = rendimento real + (aporte - retirada - compras) deflacionados', () => {
    const p = premissasPadrao(2026)
    const s = projetar(p, 'base')
    const linhas = resumoAnual(p, s)
    let realAnt = p.patrimonioInicial
    for (const l of linhas) {
      if (s.esgotouK >= 0) break
      const fluxosReais = (l.aporte - l.retirada - l.compra) / l.defl
      // aproximação: fluxos deflacionados pelo fim do ano (erro pequeno, inflação 4,5%)
      expect(l.patReal - realAnt).toBeGreaterThan(l.rendimentoReal + fluxosReais - Math.abs(l.rendimentoReal) * 0.03 - 5000)
      expect(l.patReal - realAnt).toBeLessThan(l.rendimentoReal + fluxosReais + Math.abs(l.rendimentoReal) * 0.03 + 5000)
      realAnt = l.patReal
    }
  })

  it('sem inflação, rendimento real = rendimento nominal', () => {
    const p = limpa()
    const linhas = resumoAnual(p, projetar(p, 'base'))
    for (const l of linhas) expect(l.rendimentoReal).toBeCloseTo(l.rendimento, 6)
  })
})

describe('formatos', () => {
  it('idade e meses', () => {
    expect(fmtIdade(47.25)).toBe('47 anos e 3 meses')
    expect(fmtIdade(50)).toBe('50 anos')
    expect(fmtMeses(14)).toBe('1 ano e 2 meses')
  })
})
