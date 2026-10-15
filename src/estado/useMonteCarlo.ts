import { useEffect, useRef, useState } from 'react'
import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import type { Premissas } from '../engine/types'
import type { PedidoMC, RespostaMC } from '../worker/montecarlo.worker'

/** Roda o Monte Carlo num Web Worker, com debounce; ignora respostas antigas. */
export function useMonteCarlo(premissas: Premissas, trajetorias = 5000) {
  const [resultado, setResultado] = useState<ResultadoMonteCarlo | null>(null)
  const [calculando, setCalculando] = useState(true)
  const workerRef = useRef<Worker | null>(null)
  const idRef = useRef(0)

  useEffect(() => {
    const w = new Worker(new URL('../worker/montecarlo.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (ev: MessageEvent<RespostaMC>) => {
      if (ev.data.id !== idRef.current) return
      if (ev.data.tipo === 'pronto') {
        setResultado(ev.data.resultado)
        setCalculando(false)
      }
    }
    return () => w.terminate()
  }, [])

  useEffect(() => {
    setCalculando(true)
    const t = window.setTimeout(() => {
      const id = ++idRef.current
      workerRef.current?.postMessage({ id, premissas, trajetorias } satisfies PedidoMC)
    }, 300)
    return () => window.clearTimeout(t)
  }, [premissas, trajetorias])

  return { resultado, calculando }
}
