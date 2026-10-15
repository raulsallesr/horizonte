export interface NumeroAnalisado {
  valor: number | null
  erro: string | null
}

/** Aceita a escrita brasileira (10.000,50) e decimal com ponto (4.5). */
export function analisarNumero(texto: string, min: number, max: number): NumeroAnalisado {
  let limpo = texto.trim().replace(/\s/g, '').replace(/^R\$/i, '').replace(/%$/, '')
  if (!limpo) return { valor: null, erro: 'Informe um valor.' }

  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) {
    limpo = limpo.replace(/\./g, '')
  }

  const valor = Number(limpo)
  if (!Number.isFinite(valor)) {
    return { valor: null, erro: 'Use apenas números, com vírgula para os centavos.' }
  }
  if (valor < min) {
    return { valor: null, erro: `O mínimo permitido é ${min.toLocaleString('pt-BR')}.` }
  }
  if (valor > max) {
    return { valor: null, erro: `O máximo permitido é ${max.toLocaleString('pt-BR')}.` }
  }
  return { valor, erro: null }
}
