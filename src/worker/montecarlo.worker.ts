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

self.onmessage = (ev: MessageEvent<PedidoMC>) => {
  const { id, premissas, trajetorias } = ev.data
  const resultado = monteCarlo(premissas, {
    trajetorias,
    aoProgresso: (fracao) => self.postMessage({ id, tipo: 'progresso', fracao } satisfies RespostaMC),
  })
  self.postMessage({ id, tipo: 'pronto', resultado } satisfies RespostaMC)
}
