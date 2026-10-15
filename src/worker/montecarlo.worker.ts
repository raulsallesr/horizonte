import { monteCarlo, type ResultadoMonteCarlo } from '../engine/montecarlo'
import type { Premissas } from '../engine/types'

export interface PedidoMC {
  id: number
  premissas: Premissas
  trajetorias: number
}

export type RespostaMC =
  | { id: number; tipo: 'progresso'; fracao: number }
  | { id: number; tipo: 'pronto'; resultado: ResultadoMonteCarlo }
  | { id: number; tipo: 'erro'; mensagem: string }

self.onmessage = (ev: MessageEvent<PedidoMC>) => {
  const { id, premissas, trajetorias } = ev.data
  try {
    const resultado = monteCarlo(premissas, {
      trajetorias,
      aoProgresso: (fracao) => self.postMessage({ id, tipo: 'progresso', fracao } satisfies RespostaMC),
    })
    self.postMessage({ id, tipo: 'pronto', resultado } satisfies RespostaMC)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Falha inesperada na simulação.'
    self.postMessage({ id, tipo: 'erro', mensagem } satisfies RespostaMC)
  }
}
