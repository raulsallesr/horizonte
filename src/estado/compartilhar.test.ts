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

  it('preserva links v2 na estratégia antiga de retirada', () => {
    const legado = { ...premissasPadrao(2026) } as Partial<ReturnType<typeof premissasPadrao>>
    delete legado.estrategiaPosParar
    delete legado.taxaRendaPassiva
    const bytes = new TextEncoder().encode(JSON.stringify({ versao: 2, premissas: legado }))
    let binario = ''
    bytes.forEach((byte) => (binario += String.fromCharCode(byte)))
    const texto = btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const lido = lerPremissasCompartilhadas(texto)
    expect(lido.estrategiaPosParar).toBe('retirada')
    expect(lido.taxaRendaPassiva).toBe(4)
  })

  it('saneia estratégia e taxa de renda passiva vindas de fora', () => {
    const p = premissasPadrao(2026)
    const n = sanear({ ...p, estrategiaPosParar: 'invalida', taxaRendaPassiva: 99 })
    expect(n.estrategiaPosParar).toBe('retirada')
    expect(n.taxaRendaPassiva).toBe(15)
  })

  it('saneia fases temporárias, limita idades e garante ids únicos', () => {
    const p = premissasPadrao(2026)
    const n = sanear({
      ...p,
      fluxosPosParar: [
        { id: 'repetido', nome: 'Renda parcial', tipo: 'renda', valorMensal: 2_000, idadeInicio: 20, idadeFim: 200 },
        { id: 'repetido', nome: 'Custo temporário', tipo: 'tipo-invalido', valorMensal: -10, idadeInicio: 56, idadeFim: 56 },
      ],
    })

    expect(n.fluxosPosParar).toHaveLength(2)
    expect(new Set(n.fluxosPosParar.map((f) => f.id)).size).toBe(2)
    expect(n.fluxosPosParar[0]).toMatchObject({ tipo: 'renda', idadeInicio: 55, idadeFim: 90 })
    expect(n.fluxosPosParar[1]).toMatchObject({ tipo: 'renda', valorMensal: 0, idadeInicio: 56, idadeFim: 57 })
  })

  it('migra links v3 sem fases para a lista vazia', () => {
    const legado = { ...premissasPadrao(2026) } as Partial<ReturnType<typeof premissasPadrao>>
    delete legado.fluxosPosParar
    const bytes = new TextEncoder().encode(JSON.stringify({ versao: 3, premissas: legado }))
    let binario = ''
    bytes.forEach((byte) => (binario += String.fromCharCode(byte)))
    const texto = btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const lido = lerPremissasCompartilhadas(texto)
    expect(lido.fluxosPosParar).toEqual([])
    expect(lido.estrategiaPosParar).toBe('renda_passiva')
  })
})
