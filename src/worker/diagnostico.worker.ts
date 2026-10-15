import { diagnosticarPlano, type DiagnosticoPlano } from '../engine/diagnostico'
import type { Premissas } from '../engine/types'

export interface PedidoDiagnostico {
  chave: string
  premissas: Premissas
}

export type RespostaDiagnostico =
  | { chave: string; tipo: 'pronto'; resultado: DiagnosticoPlano }
  | { chave: string; tipo: 'erro' }

self.onmessage = (evento: MessageEvent<PedidoDiagnostico>) => {
  const { chave, premissas } = evento.data
  try {
    self.postMessage({
      chave,
      tipo: 'pronto',
      resultado: diagnosticarPlano(premissas),
    } satisfies RespostaDiagnostico)
  } catch {
    self.postMessage({ chave, tipo: 'erro' } satisfies RespostaDiagnostico)
  }
}
