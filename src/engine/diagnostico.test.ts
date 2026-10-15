import { describe, expect, it } from 'vitest'
import { alternativasParaMeta, aporteMinimoParaPlano, diagnosticarPlano, idadeViavelParaParar } from './diagnostico'
import { premissasPadrao } from './padrao'
import { projetar } from './projecao'

describe('diagnóstico do plano', () => {
  it('reconhece um plano sustentável e não recomenda adiar a parada', () => {
    const p = {
      ...premissasPadrao(2026),
      barco: { ...premissasPadrao(2026).barco, ativo: false },
      extras: [],
      patrimonioInicial: 2_000_000,
      idadeParar: 55,
    }
    const diagnostico = diagnosticarPlano(p)

    expect(diagnostico.nivel).toBe('saudavel')
    expect(diagnostico.liberdadeNoPrazo).toBe(true)
    expect(diagnostico.duraAteOHorizonte).toBe(true)
    expect(diagnostico.idadeViavel).toBe(55)
  })

  it('calcula um aporte mínimo que transforma um plano insuficiente em viável', () => {
    const base = premissasPadrao(2026)
    const p = {
      ...base,
      barco: { ...base.barco, ativo: false },
      extras: [],
      patrimonioInicial: 0,
      salarioMensal: 1_000,
      aportePercentual: 0,
      idadeParar: 50,
      despesaMensal: 4_000,
    }
    const aporte = aporteMinimoParaPlano(p)

    expect(aporte).not.toBeNull()
    expect(aporte!).toBeGreaterThan(0)
    const candidato = { ...p, aporteModo: 'fixo' as const, aporteFixo: aporte!, aumentoRealAporte: 0 }
    expect(diagnosticarPlano(candidato).liberdadeNoPrazo).toBe(true)
  })

  it('encontra uma idade posterior quando adiar torna o plano viável', () => {
    const base = premissasPadrao(2026)
    const p = {
      ...base,
      barco: { ...base.barco, ativo: false },
      extras: [],
      idadeParar: 35,
      idadeFinal: 90,
    }
    const idade = idadeViavelParaParar(p)

    expect(idade).not.toBeNull()
    expect(idade!).toBeGreaterThan(35)
  })

  it('propõe adiar ou reduzir uma meta sem recursos', () => {
    const base = premissasPadrao(2026)
    const p = {
      ...base,
      patrimonioInicial: 0,
      aportePercentual: 5,
      barco: { ...base.barco, ativo: true, idade: 31, valor: 2_000_000, modo: 'vista' as const },
      extras: [],
    }
    const meta = projetar(p, 'base').metas[0]
    const alternativa = alternativasParaMeta(p, meta)

    expect(meta.status).toBe('sem_recursos')
    expect(alternativa.valorMaximoHoje).toBeLessThan(p.barco.valor)
    expect(alternativa.valorMaximoHoje).toBeGreaterThanOrEqual(0)
  })
})
