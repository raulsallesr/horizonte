import { describe, expect, it } from 'vitest'
import { analisarNumero } from './numeros'

describe('entrada numérica em pt-BR', () => {
  it('aceita milhar e decimal brasileiros', () => {
    expect(analisarNumero('10.000,50', 0, 20000).valor).toBe(10000.5)
    expect(analisarNumero('10.000', 0, 20000).valor).toBe(10000)
  })

  it('continua aceitando decimal com ponto', () => {
    expect(analisarNumero('4.5', 0, 10).valor).toBe(4.5)
  })

  it('explica valor inválido ou fora da faixa', () => {
    expect(analisarNumero('', 0, 10).erro).toContain('Informe')
    expect(analisarNumero('abc', 0, 10).erro).toContain('números')
    expect(analisarNumero('20', 0, 10).erro).toContain('máximo')
  })
})
