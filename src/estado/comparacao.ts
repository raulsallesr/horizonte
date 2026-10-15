import { normalizar } from './compartilhar'
import type { Premissas } from '../engine/types'

const CHAVE = 'horizonte:plano-referencia:v1'

export interface PlanoReferencia {
  salvoEm: string
  premissas: Premissas
}

export function lerPlanoReferencia(): PlanoReferencia | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const valor = JSON.parse(bruto) as Partial<PlanoReferencia>
    if (typeof valor.salvoEm !== 'string' || !valor.premissas || typeof valor.premissas !== 'object') {
      return null
    }
    return { salvoEm: valor.salvoEm, premissas: normalizar(valor.premissas as Premissas) }
  } catch {
    return null
  }
}

export function salvarPlanoReferencia(premissas: Premissas): PlanoReferencia {
  const referencia = { salvoEm: new Date().toISOString(), premissas: normalizar(premissas) }
  window.localStorage.setItem(CHAVE, JSON.stringify(referencia))
  return referencia
}

export function removerPlanoReferencia(): void {
  window.localStorage.removeItem(CHAVE)
}
