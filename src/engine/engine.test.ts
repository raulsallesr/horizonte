import { describe, expect, it } from 'vitest'
import { fmtIdade, fmtMeses } from './formatos'
import { idadeLiberdade, impactoBarco, mesQueAtinge, mesQueSustenta, numeroLiberdade } from './metas'
import { monteCarlo } from './montecarlo'
import { premissasPadrao } from './padrao'
import { projetar, resumoAnual, simular } from './projecao'
import type { Premissas, Serie } from './types'

/** Premissas "limpas": sem inflação, sem compras, sem aumento real. */
function limpa(extra: Partial<Premissas> = {}): Premissas {
  const p = premissasPadrao(2026)
  return {
    ...p,
    inflacao: 0,
    aumentoRealSalario: 0,
    decimoTerceiro: false,
    estrategiaPosParar: 'retirada',
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

  it('aporte fixo com 13º também faz um aporte adicional em dezembro', () => {
    const p = limpa({
      aporteModo: 'fixo',
      aporteFixo: 1000,
      decimoTerceiro: true,
      patrimonioInicial: 0,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 32,
    })
    const s = projetar(p, 'base')
    expect(s.aporte[1]).toBeCloseTo(1000, 6)
    expect(s.aporte[12]).toBeCloseTo(2000, 6)
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

  it('reinveste todo o retorno enquanto trabalha no modo renda passiva', () => {
    const p = limpa({
      estrategiaPosParar: 'renda_passiva',
      taxaRendaPassiva: 6,
      patrimonioInicial: 100_000,
      aporteModo: 'fixo',
      aporteFixo: 0,
      idadeAtual: 30,
      idadeParar: 31,
      idadeFinal: 32,
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: 12, vol: 0 }
    const s = projetar(p, 'base')

    expect(s.pat[12]).toBeCloseTo(112_000, 4)
    expect(s.rendaPassiva[12]).toBe(0)
    expect(s.retirada[12]).toBe(0)
  })

  it('usa somente a renda distribuída e registra o déficit sem vender o principal', () => {
    const p = limpa({
      estrategiaPosParar: 'renda_passiva',
      taxaRendaPassiva: 12,
      patrimonioInicial: 100_000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 61,
      despesaMensal: 2_000,
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: (Math.pow(1.01, 12) - 1) * 100, vol: 0 }
    const s = projetar(p, 'base')
    const rendaMes = 1_000

    expect(s.rendaPassiva[1]).toBeCloseTo(rendaMes, 6)
    expect(s.retirada[1]).toBeCloseTo(rendaMes, 6)
    expect(s.deficitRenda[1]).toBeCloseTo(2_000 - rendaMes, 6)
    expect(s.pat[1]).toBeCloseTo(100_000, 6)
    expect(s.esgotouNaFaseDeSaqueK).toBe(-1)
    expect(s.faltouRendaNaFasePosPararK).toBe(1)
  })

  it('reinveste o excedente da renda passiva depois de parar', () => {
    const p = limpa({
      estrategiaPosParar: 'renda_passiva',
      taxaRendaPassiva: 12,
      patrimonioInicial: 100_000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 61,
      despesaMensal: 500,
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: (Math.pow(1.01, 12) - 1) * 100, vol: 0 }
    const s = projetar(p, 'base')

    expect(s.retirada[1]).toBe(500)
    expect(s.deficitRenda[1]).toBe(0)
    expect(s.pat[1]).toBeGreaterThan(100_000)
    expect(s.faltouRendaNaFasePosPararK).toBe(-1)
  })

  it('outra renda pós-parar reduz a retirada e o número da liberdade', () => {
    const p = limpa({ despesaMensal: 5000, outraRendaPosParar: 2000, taxaRetirada: 4 })
    expect(numeroLiberdade(p)).toBeCloseTo((3000 * 12) / 0.04, 6)
  })

  it('aplica rendas e despesas temporárias apenas no intervalo programado', () => {
    const p = limpa({
      patrimonioInicial: 1_000_000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 63,
      despesaMensal: 5_000,
      fluxosPosParar: [
        { id: 'parcial', nome: 'Trabalho parcial', tipo: 'renda', valorMensal: 2_000, idadeInicio: 60, idadeFim: 61 },
        { id: 'saude', nome: 'Saúde', tipo: 'despesa', valorMensal: 500, idadeInicio: 61, idadeFim: 62 },
      ],
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: 0, vol: 0 }
    const s = projetar(p, 'base')

    expect(s.retirada[1]).toBe(3_000)
    expect(s.rendaProgramada[1]).toBe(2_000)
    expect(s.despesaProgramada[1]).toBe(0)
    expect(s.retirada[13]).toBe(5_500)
    expect(s.rendaProgramada[13]).toBe(0)
    expect(s.despesaProgramada[13]).toBe(500)
    expect(s.retirada[25]).toBe(5_000)
  })

  it('soma fases simultâneas e as inclui no resumo anual', () => {
    const p = limpa({
      patrimonioInicial: 1_000_000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 61,
      despesaMensal: 5_000,
      fluxosPosParar: [
        { id: 'inss', nome: 'INSS', tipo: 'renda', valorMensal: 1_000, idadeInicio: 60, idadeFim: 61 },
        { id: 'aluguel', nome: 'Aluguel', tipo: 'renda', valorMensal: 500, idadeInicio: 60, idadeFim: 61 },
      ],
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: 0, vol: 0 }
    const s = projetar(p, 'base')
    const [ano] = resumoAnual(p, s)

    expect(s.retirada[1]).toBe(3_500)
    expect(s.rendaProgramada[1]).toBe(1_500)
    expect(ano.rendaProgramada).toBe(18_000)
    expect(ano.despesaProgramada).toBe(0)
  })

  it('renda temporária reduz o déficit passivo sem vender o principal', () => {
    const p = limpa({
      estrategiaPosParar: 'renda_passiva',
      taxaRendaPassiva: 12,
      patrimonioInicial: 100_000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 61,
      despesaMensal: 2_500,
      fluxosPosParar: [
        { id: 'parcial', nome: 'Trabalho parcial', tipo: 'renda', valorMensal: 1_000, idadeInicio: 60, idadeFim: 61 },
      ],
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: (Math.pow(1.01, 12) - 1) * 100, vol: 0 }
    const s = projetar(p, 'base')

    expect(s.retirada[1]).toBeCloseTo(1_000, 6)
    expect(s.deficitRenda[1]).toBeCloseTo(500, 6)
    expect(s.pat[1]).toBeCloseTo(100_000, 6)
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

  it('meta sem recursos não é comprada nem cria dívida silenciosa', () => {
    const p = limpa({
      patrimonioInicial: 0,
      aporteModo: 'fixo',
      aporteFixo: 0,
      idadeAtual: 30,
      idadeParar: 90,
      idadeFinal: 35,
      barco: {
        ...premissasPadrao(2026).barco,
        ativo: true,
        valor: 100000,
        idade: 31,
        manutencaoPct: 20,
        modo: 'vista',
      },
    })
    const s = projetar(p, 'base')
    expect(s.metas).toHaveLength(1)
    expect(s.metas[0].status).toBe('sem_recursos')
    expect(s.metas[0].deficitNominal).toBeGreaterThan(0)
    expect(s.compra[12]).toBe(0)
    expect(s.pat[s.meses]).toBe(0)
  })

  it('registra separadamente o esgotamento ocorrido na fase de saque', () => {
    const p = limpa({
      patrimonioInicial: 1000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 65,
      despesaMensal: 5000,
    })
    const s = projetar(p, 'base')
    expect(s.esgotouK).toBe(1)
    expect(s.esgotouNaFaseDeSaqueK).toBe(1)
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

  it('mantém o resultado anterior quando a reserva está desativada', () => {
    const p = limpa({ patrimonioInicial: 50_000, aporteModo: 'fixo', aporteFixo: 1_000 })
    const alterado = {
      ...p,
      reservaEmergencia: { ativa: false, saldoInicial: 999_999, mesesDespesa: 24, aporteMensal: 9_999 },
    }

    expect(Array.from(projetar(alterado, 'base').pat)).toEqual(Array.from(projetar(p, 'base').pat))
  })

  it('prioriza a reserva e devolve o aporte aos investimentos quando a meta fica completa', () => {
    const p = limpa({
      patrimonioInicial: 0,
      aporteModo: 'fixo',
      aporteFixo: 1_000,
      despesaMensal: 1_000,
      idadeAtual: 30,
      idadeParar: 31,
      idadeFinal: 31,
      reservaEmergencia: { ativa: true, saldoInicial: 0, mesesDespesa: 6, aporteMensal: 1_000 },
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: 0, vol: 0 }
    const s = projetar(p, 'base')

    expect(s.reservaEmergencia[6]).toBe(6_000)
    expect(s.aporteReserva[6]).toBe(1_000)
    expect(s.pat[6]).toBe(0)
    expect(s.aporteReserva[7]).toBe(0)
    expect(s.aporte[7]).toBe(1_000)
    expect(s.pat[12]).toBe(6_000)
  })

  it('não ultrapassa a meta da reserva e investe a sobra do aporte no mesmo mês', () => {
    const p = limpa({
      patrimonioInicial: 0,
      aporteModo: 'fixo',
      aporteFixo: 1_000,
      despesaMensal: 1_000,
      idadeAtual: 30,
      idadeParar: 31,
      idadeFinal: 31,
      reservaEmergencia: { ativa: true, saldoInicial: 5_500, mesesDespesa: 6, aporteMensal: 1_000 },
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: 0, vol: 0 }
    const s = projetar(p, 'base')

    expect(s.aporteReserva[1]).toBe(500)
    expect(s.reservaEmergencia[1]).toBe(6_000)
    expect(s.aporte[1]).toBe(500)
  })

  it('preserva o poder de compra da reserva e não a usa depois de parar', () => {
    const p = limpa({
      patrimonioInicial: 0,
      aporteModo: 'fixo',
      aporteFixo: 0,
      inflacao: 12,
      despesaMensal: 5_000,
      idadeAtual: 60,
      idadeParar: 60,
      idadeFinal: 61,
      reservaEmergencia: { ativa: true, saldoInicial: 30_000, mesesDespesa: 6, aporteMensal: 1_000 },
    })
    p.cenarios.base = { ...p.cenarios.base, rentAnual: 0, vol: 0 }
    const s = projetar(p, 'base')
    const [ano] = resumoAnual(p, s)

    expect(s.pat[s.meses]).toBe(0)
    expect(s.retirada[1]).toBeGreaterThan(0)
    expect(s.aporteReserva[1]).toBe(0)
    expect(s.reservaEmergencia[s.meses] / s.defl[s.meses]).toBeCloseTo(30_000, 6)
    expect(ano.reservaEmergencia / ano.defl).toBeCloseTo(30_000, 6)
    expect(ano.aporteReserva).toBe(0)
  })
})

describe('metas', () => {
  it('número da liberdade = despesa anual / taxa de retirada', () => {
    const p = limpa({ despesaMensal: 5500, outraRendaPosParar: 0, taxaRetirada: 4 })
    expect(numeroLiberdade(p)).toBeCloseTo(1650000, 6)
  })

  it('modo renda passiva calcula a liberdade pela renda distribuída', () => {
    const p = limpa({
      estrategiaPosParar: 'renda_passiva',
      despesaMensal: 5_000,
      outraRendaPosParar: 1_000,
      taxaRendaPassiva: 6,
      taxaRetirada: 2,
    })
    expect(numeroLiberdade(p)).toBeCloseTo(800_000, 6)
  })

  it('persona padrão atinge a liberdade e o barco atrasa (ou não adianta) a data', () => {
    const p = premissasPadrao(2026)
    const idade = idadeLiberdade(p, 'base')
    expect(idade).not.toBeNull()
    expect(idade!).toBeGreaterThan(p.idadeAtual)
    expect(idade!).toBeLessThan(p.idadeFinal)
    const imp = impactoBarco(p, 'base')
    expect(imp.statusBarco).toBe('realizada')
    expect(imp.atrasoMeses).not.toBeNull()
    expect(imp.atrasoMeses!).toBeGreaterThanOrEqual(0)
  })

  it('liberdade sustentada ignora um cruzamento que cai abaixo da meta depois', () => {
    const pat = new Float64Array([120, 110, 80, 120, 130])
    const s = {
      meses: 4,
      pat,
      defl: new Float64Array([1, 1, 1, 1, 1]),
    } as unknown as Serie
    expect(mesQueAtinge(s, 100)).toBe(0)
    expect(mesQueSustenta(s, 100)).toBe(3)
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
    expect(a.probMetas.barco).toBeGreaterThanOrEqual(0)
    expect(a.probMetas.barco).toBeLessThanOrEqual(1)
  })

  it('caminho rápido (detalhe=false) bate com o completo no patrimônio', () => {
    const p = premissasPadrao(2026)
    const cen = p.cenarios.base
    const cheio = simular(p, cen)
    const leve = simular(p, cen, { detalhe: false })
    expect(Array.from(leve.pat)).toEqual(Array.from(cheio.pat))
  })

  it('separa a chance de realizar uma meta da chance de o dinheiro durar', () => {
    const p = premissasPadrao(2026)
    p.patrimonioInicial = 0
    p.aportePercentual = 0
    p.barco.valor = 100000000
    p.barco.idade = 31
    const mc = monteCarlo(p, { trajetorias: 20, semente: 9 })
    expect(mc.probMetas.barco).toBe(0)
    expect(mc.probDura).toBeGreaterThanOrEqual(0)
    expect(mc.probDura).toBeLessThanOrEqual(1)
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
