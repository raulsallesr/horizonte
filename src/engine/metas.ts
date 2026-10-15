import { resumoAnual, simular } from './projecao'
import type { Compra, IdCenario, Premissas, ResultadoMeta, Serie, StatusMeta } from './types'

/** Patrimônio (R$ de hoje) que sustenta a despesa desejada com a taxa de retirada segura. */
export function numeroLiberdade(p: Premissas): number {
  const liquida = Math.max(0, p.despesaMensal - p.outraRendaPosParar)
  return (liquida * 12) / (p.taxaRetirada / 100)
}

/** Primeiro mês em que o patrimônio real cruza `alvo` (R$ de hoje); -1 se nunca. */
export function mesQueAtinge(s: Serie, alvo: number): number {
  for (let k = 0; k <= s.meses; k++) {
    if (s.pat[k] / s.defl[k] >= alvo) return k
  }
  return -1
}

/**
 * Primeiro mês do trecho final em que o patrimônio real permanece acima do alvo.
 * Evita declarar liberdade antes de uma meta futura derrubar novamente o saldo.
 */
export function mesQueSustenta(s: Serie, alvo: number): number {
  if (s.pat[s.meses] / s.defl[s.meses] < alvo) return -1
  let k = s.meses
  while (k >= 0 && s.pat[k] / s.defl[k] >= alvo) k--
  return k + 1
}

/**
 * Idade (com fração) em que você poderia parar: o patrimônio real cruza o número da
 * liberdade e permanece acima dele até o fim do horizonte. Simula "seguir trabalhando
 * e aportando" — a data não depende da idade escolhida para parar (que só define quando
 * os saques começam na projeção principal).
 */
export function idadeLiberdade(p: Premissas, id: IdCenario, compras?: Compra[]): number | null {
  const s = simular({ ...p, idadeParar: p.idadeFinal }, p.cenarios[id], { detalhe: false, compras })
  const k = mesQueSustenta(s, numeroLiberdade(p))
  return k < 0 ? null : p.idadeAtual + k / 12
}

export function resultadoMeta(s: Serie, id: string): ResultadoMeta | null {
  return s.metas.find((m) => m.id === id) ?? null
}

export function deficitMetaReal(meta: ResultadoMeta | null): number {
  return meta ? meta.deficitNominal / meta.deflator : 0
}

export function patrimonioNaIdade(p: Premissas, s: Serie, idade: number, real: boolean): number {
  const k = Math.min(s.meses, Math.max(0, Math.round((idade - p.idadeAtual) * 12)))
  return real ? s.pat[k] / s.defl[k] : s.pat[k]
}

/** Renda mensal sustentável (R$ de hoje) que o patrimônio da idade dada gera na taxa de retirada. */
export function rendaSustentavelReal(p: Premissas, s: Serie, idade: number): number {
  return (patrimonioNaIdade(p, s, idade, true) * (p.taxaRetirada / 100)) / 12
}

/** Primeira idade em que o rendimento real do ano passa o aporte do ano (o "ponto de virada"). */
export function idadeVirada(p: Premissas, s: Serie): number | null {
  const linhas = resumoAnual(p, s)
  for (const l of linhas) {
    if (l.aporte > 0 && l.rendimentoReal > l.aporte / l.defl) return l.idade
  }
  return null
}

export interface ImpactoBarco {
  idadeCom: number | null
  idadeSem: number | null
  /** Meses de atraso na liberdade causados pelo barco; null se indefinido. */
  atrasoMeses: number | null
  statusBarco: StatusMeta
  deficitReal: number
}

/** Compara a idade da liberdade com e sem o barco (demais compras mantidas). */
export function impactoBarco(p: Premissas, id: IdCenario): ImpactoBarco {
  const seguindo = { ...p, idadeParar: p.idadeFinal }
  const serieCom = simular(seguindo, p.cenarios[id], { detalhe: false, registrarMetas: true })
  const kCom = mesQueSustenta(serieCom, numeroLiberdade(p))
  const idadeCom = kCom < 0 ? null : p.idadeAtual + kCom / 12
  const idadeSem = idadeLiberdade(p, id, p.extras)
  const metaBarco = resultadoMeta(serieCom, p.barco.id)
  const statusBarco = metaBarco?.status ?? 'fora_do_horizonte'
  const atrasoMeses =
    statusBarco === 'realizada' && idadeCom !== null && idadeSem !== null
      ? Math.max(0, Math.round((idadeCom - idadeSem) * 12))
      : null
  return { idadeCom, idadeSem, atrasoMeses, statusBarco, deficitReal: deficitMetaReal(metaBarco) }
}
