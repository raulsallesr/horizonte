import { novaCompra, novoFluxoPosParar, premissasPadrao } from '../engine/padrao'
import type { Compra, FluxoPosParar, Premissas } from '../engine/types'

const CHAVE_LS = 'horizonte:premissas:v5'
const CHAVE_LS_ANTIGA_V4 = 'horizonte:premissas:v4'
const CHAVE_LS_ANTIGA_V3 = 'horizonte:premissas:v3'
const CHAVE_LS_ANTIGA_V2 = 'horizonte:premissas:v2'
const CHAVE_LS_ANTIGA_V1 = 'horizonte:premissas:v1'
const MAX_EXTRAS = 8
const MAX_FLUXOS_POS_PARAR = 8
const VERSAO_LINK = 5

// ---- codificação para o hash da URL (JSON -> UTF-8 -> base64url) ----

export function codificar(p: Premissas): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ versao: VERSAO_LINK, premissas: p }))
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

function normalizarCompra(c: Compra, idadeMinima: number, idadeMaxima: number, valorMinimo = 0): Compra {
  return {
    ...c,
    idade: Math.round(limitar(c.idade, idadeMinima, idadeMaxima)),
    valor: limitar(c.valor, valorMinimo, 1e8),
    manutencaoPct: limitar(c.manutencaoPct, 0, 20),
    caixinhaMensal: limitar(c.caixinhaMensal, 0, 1e7),
    modo: c.modo === 'caixinha' ? 'caixinha' : 'vista',
  }
}

function normalizarFluxoPosParar(
  fluxo: FluxoPosParar,
  idadeParar: number,
  idadeFinal: number,
): FluxoPosParar {
  const idadeInicio = Math.round(limitar(fluxo.idadeInicio, idadeParar, idadeFinal - 1))
  return {
    ...fluxo,
    nome: fluxo.nome.slice(0, 40),
    tipo: fluxo.tipo === 'despesa' ? 'despesa' : 'renda',
    valorMensal: limitar(fluxo.valorMensal, 0, 1e7),
    idadeInicio,
    idadeFim: Math.round(limitar(fluxo.idadeFim, idadeInicio + 1, idadeFinal)),
  }
}

/** Garante faixas válidas e coerência entre idades. */
export function normalizar(p: Premissas): Premissas {
  const idadeAtual = Math.round(limitar(p.idadeAtual, 18, 70))
  const idadeParar = Math.round(limitar(p.idadeParar, idadeAtual, 80))
  const idadeFinal = Math.round(limitar(p.idadeFinal, Math.max(60, idadeParar + 1, idadeAtual + 5), 105))
  const idadeMetaMinima = idadeAtual + 1
  const idadeMetaMaxima = idadeFinal - 1
  const ids = new Set<string>()
  const extras = p.extras.slice(0, MAX_EXTRAS).map((compra, i) => {
    const baseId = compra.id.slice(0, 24) || `extra-${i + 1}`
    let id = baseId
    let sufixo = 2
    while (ids.has(id)) id = `${baseId.slice(0, 20)}-${sufixo++}`
    ids.add(id)
    return {
      ...normalizarCompra(compra, idadeMetaMinima, idadeMetaMaxima),
      id,
      // A interface de metas extras não oferece estes atributos; dados externos
      // também não podem ativá-los de forma invisível.
      manutencaoPct: 0,
      modo: 'vista' as const,
      caixinhaMensal: 0,
    }
  })
  const idsFluxos = new Set<string>()
  const fluxosPosParar = p.fluxosPosParar.slice(0, MAX_FLUXOS_POS_PARAR).map((fluxo, i) => {
    const baseId = fluxo.id.slice(0, 24) || `fluxo-${i + 1}`
    let id = baseId
    let sufixo = 2
    while (idsFluxos.has(id)) id = `${baseId.slice(0, 20)}-${sufixo++}`
    idsFluxos.add(id)
    return { ...normalizarFluxoPosParar(fluxo, idadeParar, idadeFinal), id }
  })
  return {
    ...p,
    idadeAtual,
    idadeParar,
    idadeFinal,
    patrimonioInicial: limitar(p.patrimonioInicial, 0, 1e9),
    salarioMensal: limitar(p.salarioMensal, 1000, 1e7),
    aumentoRealSalario: limitar(p.aumentoRealSalario, 0, 8),
    aportePercentual: limitar(p.aportePercentual, 0, 70),
    aporteFixo: limitar(p.aporteFixo, 0, 1e7),
    aumentoRealAporte: limitar(p.aumentoRealAporte, 0, 8),
    reservaEmergencia: {
      ativa: p.reservaEmergencia.ativa,
      saldoInicial: limitar(p.reservaEmergencia.saldoInicial, 0, 1e9),
      mesesDespesa: Math.round(limitar(p.reservaEmergencia.mesesDespesa, 1, 36)),
      aporteMensal: limitar(p.reservaEmergencia.aporteMensal, 0, 1e7),
    },
    inflacao: limitar(p.inflacao, 0, 12),
    despesaMensal: limitar(p.despesaMensal, 1000, 1e7),
    outraRendaPosParar: limitar(p.outraRendaPosParar, 0, 1e7),
    estrategiaPosParar: p.estrategiaPosParar === 'renda_passiva' ? 'renda_passiva' : 'retirada',
    taxaRendaPassiva: limitar(Number.isFinite(p.taxaRendaPassiva) ? p.taxaRendaPassiva : 4, 0.1, 15),
    taxaRetirada: limitar(p.taxaRetirada, 2, 6),
    fluxosPosParar,
    aporteModo: p.aporteModo === 'fixo' ? 'fixo' : 'percentual',
    cenarios: {
      pessimista: { id: 'pessimista', nome: 'Pessimista', rentAnual: limitar(p.cenarios.pessimista.rentAnual, 0, 25), vol: limitar(p.cenarios.pessimista.vol, 0, 30) },
      base: { id: 'base', nome: 'Base', rentAnual: limitar(p.cenarios.base.rentAnual, 0, 25), vol: limitar(p.cenarios.base.vol, 0, 30) },
      otimista: { id: 'otimista', nome: 'Otimista', rentAnual: limitar(p.cenarios.otimista.rentAnual, 0, 25), vol: limitar(p.cenarios.otimista.vol, 0, 30) },
    },
    barco: {
      ...normalizarCompra(p.barco, idadeMetaMinima, idadeMetaMaxima, 10000),
      id: 'barco',
      ativo: p.barco.ativo,
    },
    extras,
  }
}

/** Constrói premissas válidas a partir de qualquer JSON de fora. */
export function sanear(entrada: unknown): Premissas {
  const base = premissasPadrao()
  const p = mesclar(base, entrada)
  // Planos anteriores à v3 usavam exclusivamente retirada do patrimônio.
  // Preservar essa semântica evita alterar silenciosamente links e dados salvos.
  if (ehObj(entrada) && !('estrategiaPosParar' in entrada)) p.estrategiaPosParar = 'retirada'
  const extrasIn = ehObj(entrada) && Array.isArray(entrada.extras) ? entrada.extras : base.extras
  p.extras = extrasIn.slice(0, MAX_EXTRAS).map((e, i) => {
    const m = mesclar(novaCompra(p.idadeAtual), e)
    return ehObj(e) && typeof e.id === 'string' ? { ...m, id: e.id.slice(0, 24) } : { ...m, id: `extra-${i}` }
  })
  const fluxosIn = ehObj(entrada) && Array.isArray(entrada.fluxosPosParar) ? entrada.fluxosPosParar : base.fluxosPosParar
  p.fluxosPosParar = fluxosIn.slice(0, MAX_FLUXOS_POS_PARAR).map((fluxo, i) => {
    const modelo = novoFluxoPosParar(p.idadeParar, p.idadeFinal)
    const mesclado = mesclar(modelo, fluxo)
    return ehObj(fluxo) && typeof fluxo.id === 'string'
      ? { ...mesclado, id: fluxo.id.slice(0, 24) }
      : { ...mesclado, id: `fluxo-${i}` }
  })
  p.anoBase = base.anoBase
  return normalizar(p)
}

function extrairPremissasDoLink(entrada: unknown): unknown {
  if (!ehObj(entrada) || !('versao' in entrada)) return entrada // compatibilidade com links v1
  if ((entrada.versao !== 2 && entrada.versao !== 3 && entrada.versao !== 4 && entrada.versao !== VERSAO_LINK) || !('premissas' in entrada)) {
    throw new Error('versão de link incompatível')
  }
  return entrada.premissas
}

export function lerPremissasCompartilhadas(texto: string): Premissas {
  return sanear(extrairPremissasDoLink(decodificar(texto)))
}

// ---- leitura / gravação ----

export interface CargaInicial {
  premissas: Premissas
  origem: 'link' | 'local' | 'padrao'
  aviso: string | null
}

export function carregarInicial(): CargaInicial {
  const h = window.location.hash.replace(/^#/, '')
  if (h.startsWith('s=')) {
    try {
      return {
        premissas: lerPremissasCompartilhadas(h.slice(2)),
        origem: 'link',
        aviso: null,
      }
    } catch {
      return {
        premissas: premissasPadrao(),
        origem: 'padrao',
        aviso: 'Este link de simulação é inválido ou incompatível. O exemplo padrão foi carregado com segurança.',
      }
    }
  }
  try {
    const salvo =
      window.localStorage.getItem(CHAVE_LS) ??
      window.localStorage.getItem(CHAVE_LS_ANTIGA_V4) ??
      window.localStorage.getItem(CHAVE_LS_ANTIGA_V3) ??
      window.localStorage.getItem(CHAVE_LS_ANTIGA_V2) ??
      window.localStorage.getItem(CHAVE_LS_ANTIGA_V1)
    if (salvo) return { premissas: sanear(JSON.parse(salvo)), origem: 'local', aviso: null }
  } catch {
    /* sem storage */
  }
  return { premissas: premissasPadrao(), origem: 'padrao', aviso: null }
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
    window.localStorage.removeItem(CHAVE_LS_ANTIGA_V4)
    window.localStorage.removeItem(CHAVE_LS_ANTIGA_V3)
    window.localStorage.removeItem(CHAVE_LS_ANTIGA_V2)
    window.localStorage.removeItem(CHAVE_LS_ANTIGA_V1)
  } catch {
    /* ignora */
  }
  try {
    window.history.replaceState(null, '', window.location.pathname)
  } catch {
    /* ignora */
  }
}
