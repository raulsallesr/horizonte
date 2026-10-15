import { describe, expect, it } from 'vitest'
import { premissasPadrao } from '../engine/padrao'
import { codificar, lerPremissasCompartilhadas, normalizar, sanear } from './compartilhar'

describe('normalização de estado compartilhado', () => {
  it('mantém todas as metas dentro do horizonte quando as idades mudam', () => {
    const p = premissasPadrao(2026)
    p.idadeAtual = 50
    p.idadeParar = 55
    p.idadeFinal = 60
    p.barco.idade = 42
    p.extras[0].idade = 90

    const n = normalizar(p)
    expect(n.barco.idade).toBe(51)
    expect(n.extras[0].idade).toBe(59)
  })

  it('remove atributos invisíveis das metas extras e garante ids únicos', () => {
    const p = premissasPadrao(2026)
    p.extras = [
      { ...p.extras[0], id: 'duplicado', modo: 'caixinha', manutencaoPct: 12, caixinhaMensal: 500 },
      { ...p.extras[0], id: 'duplicado' },
    ]

    const n = normalizar(p)
    expect(new Set(n.extras.map((e) => e.id)).size).toBe(2)
    for (const extra of n.extras) {
      expect(extra.modo).toBe('vista')
      expect(extra.manutencaoPct).toBe(0)
      expect(extra.caixinhaMensal).toBe(0)
    }
  })

  it('restaura nomes e ids canônicos dos cenários vindos de fora', () => {
    const entrada = premissasPadrao(2026)
    entrada.cenarios.base.nome = 'Retorno garantido'
    entrada.cenarios.base.id = 'otimista'
    const n = sanear(entrada)
    expect(n.cenarios.base).toMatchObject({ id: 'base', nome: 'Base' })
  })

  it('lê o envelope atual e rejeita conteúdo inválido', () => {
    const p = premissasPadrao(2026)
    p.nome = 'Teste compartilhado'
    expect(lerPremissasCompartilhadas(codificar(p)).nome).toBe('Teste compartilhado')
    expect(() => lerPremissasCompartilhadas('nao-e-base64')).toThrow()
  })
})
