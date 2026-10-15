import { mesesTotais, simular } from './projecao'
import { numeroLiberdade } from './metas'
import type { Premissas } from './types'

/** PRNG determinístico (mulberry32). */
export function criarPrng(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Normal padrão por Box-Muller. */
function normal(rand: () => number): number {
  const u = Math.max(rand(), 1e-12)
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export interface ResultadoMonteCarlo {
  trajetorias: number
  /** Idade ao fim de cada ano simulado (ponto 0 = hoje). */
  idades: number[]
  /** Percentis do patrimônio em R$ de hoje, por ponto de `idades`. */
  p10: number[]
  p50: number[]
  p90: number[]
  /** Fração (0..1) das trajetórias que já atingiram a liberdade até cada idade. */
  probLiberdade: number[]
  /** Fração das trajetórias em que o patrimônio nunca zera até a idade final. */
  probDura: number
  /** Fração que atinge a liberdade até `idadeParar`. */
  probLiberdadeAteParar: number
}

function percentil(ordenado: Float64Array, q: number): number {
  const pos = (ordenado.length - 1) * q
  const i = Math.floor(pos)
  const frac = pos - i
  return i + 1 < ordenado.length ? ordenado[i] * (1 - frac) + ordenado[i + 1] * frac : ordenado[i]
}

export function monteCarlo(
  p: Premissas,
  opts: { trajetorias?: number; semente?: number; aoProgresso?: (fracao: number) => void } = {},
): ResultadoMonteCarlo {
  const n = opts.trajetorias ?? 5000
  const N = mesesTotais(p)
  const cenario = p.cenarios.base
  const rand = criarPrng(opts.semente ?? 20261015)

  const mu = Math.pow(1 + cenario.rentAnual / 100, 1 / 12) - 1
  const sigma = cenario.vol / 100 / Math.sqrt(12)
  const numero = numeroLiberdade(p)

  const anos = Math.floor(N / 12)
  const colunas = anos + 1
  const matriz = new Float64Array(n * colunas)
  const primeiraLib = new Int32Array(n).fill(-1)
  let duram = 0
  let libAteParar = 0
  const kParar = Math.round((p.idadeParar - p.idadeAtual) * 12)
  const retornos = new Float64Array(N)
  // "liberdade" = poder parar: detectada numa simulação em que você segue trabalhando
  const pSeguir = { ...p, idadeParar: p.idadeFinal }

  for (let t = 0; t < n; t++) {
    for (let k = 0; k < N; k++) {
      retornos[k] = Math.max(-0.99, mu + sigma * normal(rand))
    }
    const s = simular(p, cenario, { retornos, detalhe: false })
    if (s.esgotouK < 0) duram++
    for (let a = 0; a < colunas; a++) {
      matriz[t * colunas + a] = s.pat[a * 12] / s.defl[a * 12]
    }
    const seguindo = simular(pSeguir, cenario, { retornos, detalhe: false })
    for (let k = 0; k <= N; k++) {
      if (seguindo.pat[k] / seguindo.defl[k] >= numero) {
        primeiraLib[t] = k
        if (k <= kParar) libAteParar++
        break
      }
    }
    if (opts.aoProgresso && t % 250 === 0) opts.aoProgresso(t / n)
  }

  const idades: number[] = []
  const p10: number[] = []
  const p50: number[] = []
  const p90: number[] = []
  const probLiberdade: number[] = []
  const coluna = new Float64Array(n)
  for (let a = 0; a < colunas; a++) {
    for (let t = 0; t < n; t++) coluna[t] = matriz[t * colunas + a]
    coluna.sort()
    idades.push(p.idadeAtual + a)
    p10.push(percentil(coluna, 0.1))
    p50.push(percentil(coluna, 0.5))
    p90.push(percentil(coluna, 0.9))
    const limite = a * 12
    let ja = 0
    for (let t = 0; t < n; t++) if (primeiraLib[t] >= 0 && primeiraLib[t] <= limite) ja++
    probLiberdade.push(ja / n)
  }

  return {
    trajetorias: n,
    idades,
    p10,
    p50,
    p90,
    probLiberdade,
    probDura: duram / n,
    probLiberdadeAteParar: libAteParar / n,
  }
}
