import { startTransition, useEffect, useMemo, useState } from 'react'
import { diagnosticoBasico, type DiagnosticoPlano } from '../engine/diagnostico'
import type { Premissas, Serie } from '../engine/types'
import type { PedidoDiagnostico, RespostaDiagnostico } from '../worker/diagnostico.worker'

interface EstadoDiagnostico {
  chave: string
  resultado: DiagnosticoPlano | null
  concluido: boolean
}

const VAZIO: EstadoDiagnostico = { chave: '', resultado: null, concluido: false }

/** Mantém a leitura essencial síncrona e calcula recomendações iterativas fora da interface. */
export function useDiagnostico(premissas: Premissas, serieBase: Serie) {
  const [estado, setEstado] = useState<EstadoDiagnostico>(VAZIO)
  const chave = useMemo(() => JSON.stringify(premissas), [premissas])
  const basico = useMemo(
    () => diagnosticoBasico(premissas, serieBase),
    [premissas, serieBase],
  )

  useEffect(() => {
    let worker: Worker | null = null
    const timer = window.setTimeout(() => {
      worker = new Worker(new URL('../worker/diagnostico.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (evento: MessageEvent<RespostaDiagnostico>) => {
        if (evento.data.chave !== chave) return
        startTransition(() => {
          setEstado({
            chave,
            resultado: evento.data.tipo === 'pronto' ? evento.data.resultado : null,
            concluido: true,
          })
        })
        worker?.terminate()
        worker = null
      }
      worker.onerror = () => {
        setEstado({ chave, resultado: null, concluido: true })
        worker?.terminate()
        worker = null
      }
      worker.postMessage({ chave, premissas } satisfies PedidoDiagnostico)
    }, 80)

    return () => {
      window.clearTimeout(timer)
      worker?.terminate()
    }
  }, [chave, premissas])

  const atual = estado.chave === chave
  return {
    diagnostico: atual && estado.resultado ? estado.resultado : basico,
    calculando: !atual || !estado.concluido,
  }
}
