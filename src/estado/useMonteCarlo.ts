import { useEffect, useMemo, useState } from 'react'
import type { ResultadoMonteCarlo } from '../engine/montecarlo'
import type { Premissas } from '../engine/types'
import type { PedidoMC, RespostaMC } from '../worker/montecarlo.worker'

type FaseMC = 'aguardando' | 'calculando' | 'pronto' | 'erro'

interface EstadoMC {
  chave: string
  fase: FaseMC
  resultado: ResultadoMonteCarlo | null
  progresso: number
  erro: string | null
}

const VAZIO: EstadoMC = {
  chave: '',
  fase: 'aguardando',
  resultado: null,
  progresso: 0,
  erro: null,
}

/**
 * Roda o Monte Carlo em um Worker isolado. Cada alteração encerra o Worker anterior,
 * portanto cálculos obsoletos não continuam consumindo CPU nem entram numa fila.
 */
export function useMonteCarlo(premissas: Premissas, trajetorias = 5000) {
  const [estado, setEstado] = useState<EstadoMC>(VAZIO)
  const [tentativa, setTentativa] = useState(0)
  const chave = useMemo(
    () => `${tentativa}:${trajetorias}:${JSON.stringify(premissas)}`,
    [premissas, tentativa, trajetorias],
  )

  useEffect(() => {
    let worker: Worker | null = null
    const id = tentativa + 1
    const timer = window.setTimeout(() => {
      setEstado({ chave, fase: 'calculando', resultado: null, progresso: 0, erro: null })
      worker = new Worker(new URL('../worker/montecarlo.worker.ts', import.meta.url), { type: 'module' })

      worker.onmessage = (ev: MessageEvent<RespostaMC>) => {
        if (ev.data.id !== id) return
        if (ev.data.tipo === 'progresso') {
          const fracao = ev.data.fracao
          setEstado((atual) =>
            atual.chave === chave ? { ...atual, progresso: fracao } : atual,
          )
        } else if (ev.data.tipo === 'pronto') {
          setEstado({ chave, fase: 'pronto', resultado: ev.data.resultado, progresso: 1, erro: null })
          worker?.terminate()
          worker = null
        } else {
          setEstado({ chave, fase: 'erro', resultado: null, progresso: 0, erro: ev.data.mensagem })
          worker?.terminate()
          worker = null
        }
      }

      worker.onerror = () => {
        setEstado({
          chave,
          fase: 'erro',
          resultado: null,
          progresso: 0,
          erro: 'Não foi possível calcular as probabilidades neste navegador.',
        })
        worker?.terminate()
        worker = null
      }

      worker.postMessage({ id, premissas, trajetorias } satisfies PedidoMC)
    }, 300)

    return () => {
      window.clearTimeout(timer)
      worker?.terminate()
    }
  }, [chave, premissas, tentativa, trajetorias])

  const atual = estado.chave === chave
  const fase: FaseMC = atual ? estado.fase : 'aguardando'
  return {
    resultado: atual ? estado.resultado : null,
    fase,
    calculando: fase === 'aguardando' || fase === 'calculando',
    progresso: atual ? estado.progresso : 0,
    erro: atual ? estado.erro : null,
    recalcular: () => setTentativa((n) => n + 1),
  }
}
