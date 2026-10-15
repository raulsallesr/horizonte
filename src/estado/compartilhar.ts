import { novaCompra, premissasPadrao } from '../engine/padrao'
import type { Compra, Premissas } from '../engine/types'

const CHAVE_LS = 'horizonte:premissas:v1'
const MAX_EXTRAS = 8

// ---- codificação para o hash da URL (JSON -> UTF-8 -> base64url) ----

export function codificar(p: Premissas): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodificar(texto: string): unknown {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

// ---- saneamento: nunca confiar em dado de fora ----

type Obj = Record<string, unknown>
const ehObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

function mesclar<T extends object>(baseT: T, entrada: unknown): T {
  if (!ehObj(entrada)) return baseT
  const base = baseT as unknown as Obj
  const saida: Obj = { ...base }
  for (const k of Object.keys(base)) {
    const b = base[k]
    const e = entrada[k]
    if (typeof b === 'number') saida[k] = typeof e === 'number' && Number.isFinite(e) ? e : b
    else if (typeof b === 'string') saida[k] = typeof e === 'string' ? e.slice(0, 40) : b
    else if (typeof b === 'boolean') saida[k] = typeof e === 'boolean' ? e : b
    else if (ehObj(b)) saida[k] = mesclar(b, e)
  }
  return saida as unknown as T
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function normalizarCompra(c: Compra): Compra {
  return {
    ...c,
    valor: limitar(c.valor, 0, 1e8),
    manutencaoPct: limitar(c.manutencaoPct, 0, 50),
    caixinhaMensal: limitar(c.caixinhaMensal, 0, 1e6),
    modo: c.modo === 'caixinha' ? 'caixinha' : 'vista',
  }
}

/** Garante faixas válidas e coerência entre idades. */
export function normalizar(p: Premissas): Premissas {
  const idadeAtual = Math.round(limitar(p.idadeAtual, 16, 80))
  const idadeParar = Math.round(limitar(p.idadeParar, idadeAtual, 90))
  const idadeFinal = Math.round(limitar(p.idadeFinal, Math.max(idadeParar + 1, idadeAtual + 5), 110))
  return {
    ...p,
    idadeAtual,
    idadeParar,
    idadeFinal,
    patrimonioInicial: limitar(p.patrimonioInicial, 0, 1e9),
    salarioMensal: limitar(p.salarioMensal, 0, 1e7),
    aumentoRealSalario: limitar(p.aumentoRealSalario, -10, 20),
    aportePercentual: limitar(p.aportePercentual, 0, 100),
    aporteFixo: limitar(p.aporteFixo, 0, 1e7),
    aumentoRealAporte: limitar(p.aumentoRealAporte, -10, 20),
    inflacao: limitar(p.inflacao, 0, 30),
    despesaMensal: limitar(p.despesaMensal, 0, 1e7),
    outraRendaPosParar: limitar(p.outraRendaPosParar, 0, 1e7),
    taxaRetirada: limitar(p.taxaRetirada, 1, 10),
    aporteModo: p.aporteModo === 'fixo' ? 'fixo' : 'percentual',
    cenarios: {
      pessimista: { ...p.cenarios.pessimista, rentAnual: limitar(p.cenarios.pessimista.rentAnual, -5, 40), vol: limitar(p.cenarios.pessimista.vol, 0, 60) },
      base: { ...p.cenarios.base, rentAnual: limitar(p.cenarios.base.rentAnual, -5, 40), vol: limitar(p.cenarios.base.vol, 0, 60) },
      otimista: { ...p.cenarios.otimista, rentAnual: limitar(p.cenarios.otimista.rentAnual, -5, 40), vol: limitar(p.cenarios.otimista.vol, 0, 60) },
    },
    barco: { ...normalizarCompra(p.barco), ativo: p.barco.ativo },
    extras: p.extras.slice(0, MAX_EXTRAS).map(normalizarCompra),
  }
}

/** Constrói premissas válidas a partir de qualquer JSON de fora. */
export function sanear(entrada: unknown): Premissas {
  const base = premissasPadrao()
  const p = mesclar(base, entrada)
  const extrasIn = ehObj(entrada) && Array.isArray(entrada.extras) ? entrada.extras : base.extras
  p.extras = extrasIn.slice(0, MAX_EXTRAS).map((e, i) => {
    const m = mesclar(novaCompra(p.idadeAtual), e)
    return ehObj(e) && typeof e.id === 'string' ? { ...m, id: e.id.slice(0, 24) } : { ...m, id: `extra-${i}` }
  })
  p.anoBase = base.anoBase
  return normalizar(p)
}

// ---- leitura / gravação ----

export function carregarInicial(): Premissas {
  try {
    const h = window.location.hash.replace(/^#/, '')
    if (h.startsWith('s=')) return sanear(decodificar(h.slice(2)))
  } catch {
    /* link inválido: cai no próximo */
  }
  try {
    const salvo = window.localStorage.getItem(CHAVE_LS)
    if (salvo) return sanear(JSON.parse(salvo))
  } catch {
    /* sem storage */
  }
  return premissasPadrao()
}

export function persistir(p: Premissas): void {
  try {
    window.localStorage.setItem(CHAVE_LS, JSON.stringify(p))
  } catch {
    /* ignora */
  }
  try {
    window.history.replaceState(null, '', `#s=${codificar(p)}`)
  } catch {
    /* ignora */
  }
}

export function limparPersistencia(): void {
  try {
    window.localStorage.removeItem(CHAVE_LS)
  } catch {
    /* ignora */
  }
  try {
    window.history.replaceState(null, '', window.location.pathname)
  } catch {
    /* ignora */
  }
}
