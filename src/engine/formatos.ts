const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export const fmtBRL = (v: number) => brl.format(Math.round(v))

/** R$ 1,2 mi / R$ 350 mil / R$ 900 */
export function fmtBRLCompacto(v: number): string {
  const a = Math.abs(v)
  const sinal = v < 0 ? '-' : ''
  if (a >= 1e9) return `${sinal}R$ ${num.format(a / 1e9)} bi`
  if (a >= 1e6) return `${sinal}R$ ${num.format(a / 1e6)} mi`
  if (a >= 1e4) return `${sinal}R$ ${num.format(a / 1e3)} mil`
  return fmtBRL(v)
}

export const fmtPct = (v: number, casas = 1) =>
  `${v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`

/** 0.63 -> "63%" */
export const fmtFracao = (f: number) => `${Math.round(f * 100)}%`

/** 47.25 -> "47 anos e 3 meses" */
export function fmtIdade(idade: number): string {
  const meses = Math.round(idade * 12)
  const a = Math.floor(meses / 12)
  const m = meses % 12
  if (m === 0) return `${a} anos`
  return `${a} anos e ${m} ${m === 1 ? 'mês' : 'meses'}`
}

export function fmtMeses(meses: number): string {
  const a = Math.floor(Math.abs(meses) / 12)
  const m = Math.abs(meses) % 12
  const partes: string[] = []
  if (a > 0) partes.push(`${a} ${a === 1 ? 'ano' : 'anos'}`)
  if (m > 0) partes.push(`${m} ${m === 1 ? 'mês' : 'meses'}`)
  return partes.length ? partes.join(' e ') : '0 meses'
}
