import type { Cenario, Compra, IdCenario, LinhaAnual, Premissas, ResultadoMeta, Serie } from './types'

const taxaMensal = (aaPct: number) => Math.pow(1 + aaPct / 100, 1 / 12) - 1

/** Compras ativas: barco (se ativo) + extras. */
export function comprasAtivas(p: Premissas): Compra[] {
  return [...(p.barco.ativo ? [p.barco] : []), ...p.extras]
}

export function mesesTotais(p: Premissas): number {
  return Math.max(1, Math.round((p.idadeFinal - p.idadeAtual) * 12))
}

/** Deflator de preços no mês k. */
export function deflatorMes(p: Premissas, k: number): number {
  return Math.pow(1 + p.inflacao / 100, k / 12)
}

/**
 * Núcleo da simulação mensal. Fluxos (aporte, retirada, compras) acontecem
 * no fim do mês, depois do rendimento sobre o saldo do início do mês.
 * `retornos` opcional (retorno mensal por mês, índice 0 = mês 1) troca a
 * taxa fixa do cenário — é o gancho do Monte Carlo.
 * `detalhe = false` só preenche patrimônio/deflator (caminho rápido).
 */
export function simular(
  p: Premissas,
  cenario: Cenario,
  opts: { retornos?: Float64Array; detalhe?: boolean; compras?: Compra[]; registrarMetas?: boolean } = {},
): Serie {
  const N = mesesTotais(p)
  const detalhe = opts.detalhe ?? true
  const registrarMetas = opts.registrarMetas ?? detalhe
  const compras = opts.compras ?? comprasAtivas(p)
  const rmFixo = taxaMensal(cenario.rentAnual)
  const gSal = 1 + p.aumentoRealSalario / 100
  const gApo = 1 + p.aumentoRealAporte / 100
  const fMes = Math.pow(1 + p.inflacao / 100, 1 / 12)

  const pat = new Float64Array(N + 1)
  const defl = new Float64Array(N + 1)
  const mk = () => (detalhe ? new Float64Array(N + 1) : new Float64Array(0))
  const aporte = mk()
  const rendimento = mk()
  const retirada = mk()
  const compra = mk()

  // mês (passo) em que cada compra acontece
  const passoCompra = compras.map((c) => Math.max(1, Math.round((c.idade - p.idadeAtual) * 12)))
  const encerrada = compras.map(() => false)
  const realizada = compras.map(() => false)
  const metas: ResultadoMeta[] = []

  let invest = p.patrimonioInicial
  const caixinha = compras.map(() => 0)
  let esgotouK = -1
  let esgotouNaFaseDeSaqueK = -1
  let f = 1
  pat[0] = invest
  defl[0] = 1

  for (let k = 1; k <= N; k++) {
    f *= fMes
    defl[k] = f
    const rm = opts.retornos ? opts.retornos[k - 1] : rmFixo
    const anoIdx = Math.floor((k - 1) / 12)
    const trabalhando = p.idadeAtual + (k - 1) / 12 < p.idadeParar

    // rendimento do mês sobre o saldo do início do mês
    let rend = invest * rm
    invest += rend
    for (let i = 0; i < caixinha.length; i++) {
      const r = caixinha[i] * rm
      caixinha[i] += r
      rend += r
    }

    let ap = 0
    let ret = 0
    let cmp = 0
    let sepTotal = 0

    if (trabalhando) {
      const salNominal = p.salarioMensal * Math.pow(gSal, anoIdx) * f
      const multiplicadorDezembro = p.decimoTerceiro && k % 12 === 0 ? 2 : 1
      const rendaMes = salNominal * multiplicadorDezembro
      ap =
        p.aporteModo === 'percentual'
          ? (p.aportePercentual / 100) * rendaMes
          : p.aporteFixo * Math.pow(gApo, anoIdx) * f * multiplicadorDezembro
    } else {
      ret = Math.max(0, (p.despesaMensal - p.outraRendaPosParar) * f)
    }

    // caixinha: separa parte do aporte para a compra, até o mês da compra
    for (let i = 0; i < compras.length; i++) {
      const c = compras[i]
      if (c.modo === 'caixinha' && !encerrada[i] && k < passoCompra[i] && ap > 0) {
        const sep = Math.min(ap, c.caixinhaMensal * f)
        caixinha[i] += sep
        ap -= sep
        sepTotal += sep
      }
    }

    invest += ap
    invest -= ret

    // compras no mês
    for (let i = 0; i < compras.length; i++) {
      const c = compras[i]
      if (!encerrada[i] && k === passoCompra[i]) {
        encerrada[i] = true
        const custo = c.valor * f
        const recursos = invest + (c.modo === 'caixinha' ? caixinha[i] : 0)
        const deficit = Math.max(0, custo - recursos)
        if (deficit <= 0.01) {
          realizada[i] = true
          cmp += custo
          if (c.modo === 'caixinha') {
            invest += caixinha[i] - custo
            caixinha[i] = 0
          } else {
            invest -= custo
          }
        } else {
          // A meta falha fechada: não cria dívida nem finge que a compra aconteceu.
          // O que estava reservado volta a compor o patrimônio investido.
          invest += caixinha[i]
          caixinha[i] = 0
        }
        if (registrarMetas) {
          metas.push({
            id: c.id,
            nome: c.nome,
            idade: c.idade,
            status: realizada[i] ? 'realizada' : 'sem_recursos',
            custoNominal: custo,
            recursosNominais: recursos,
            deficitNominal: deficit,
            deflator: f,
          })
        }
      }
    }
    // manutenção (após a compra)
    for (let i = 0; i < compras.length; i++) {
      const c = compras[i]
      if (realizada[i] && k > passoCompra[i] && c.manutencaoPct > 0) {
        const m = (c.valor * (c.manutencaoPct / 100) * f) / 12
        invest -= m
        cmp += m
      }
    }

    if (invest < 0) {
      invest = 0
      if (esgotouK < 0) esgotouK = k
      if (!trabalhando && esgotouNaFaseDeSaqueK < 0) esgotouNaFaseDeSaqueK = k
    }

    let total = invest
    for (let i = 0; i < caixinha.length; i++) total += caixinha[i]
    pat[k] = total

    if (detalhe) {
      aporte[k] = ap + sepTotal
      rendimento[k] = rend
      retirada[k] = ret
      compra[k] = cmp
    }
  }

  if (registrarMetas) {
    for (let i = 0; i < compras.length; i++) {
      if (!encerrada[i]) {
        const c = compras[i]
        metas.push({
          id: c.id,
          nome: c.nome,
          idade: c.idade,
          status: 'fora_do_horizonte',
          custoNominal: 0,
          recursosNominais: 0,
          deficitNominal: 0,
          deflator: defl[N],
        })
      }
    }
  }

  return {
    meses: N,
    idadeAtual: p.idadeAtual,
    pat,
    defl,
    aporte,
    rendimento,
    retirada,
    compra,
    esgotouK,
    esgotouNaFaseDeSaqueK,
    metas,
  }
}

export function projetar(p: Premissas, id: IdCenario): Serie {
  return simular(p, p.cenarios[id])
}

/** Agrega a série mensal em linhas anuais (fim de cada ano de vida). */
export function resumoAnual(p: Premissas, s: Serie): LinhaAnual[] {
  const linhas: LinhaAnual[] = []
  for (let a = 0; a * 12 < s.meses; a++) {
    const ini = a * 12 + 1
    const fim = Math.min(s.meses, (a + 1) * 12)
    let ap = 0
    let rd = 0
    let rdReal = 0
    let rt = 0
    let cp = 0
    for (let k = ini; k <= fim; k++) {
      ap += s.aporte[k]
      rd += s.rendimento[k]
      // rendimento real do mês = juros deflacionados + erosão do saldo anterior pela inflação
      rdReal += s.rendimento[k] / s.defl[k] + s.pat[k - 1] * (1 / s.defl[k] - 1 / s.defl[k - 1])
      rt += s.retirada[k]
      cp += s.compra[k]
    }
    linhas.push({
      idade: p.idadeAtual + fim / 12,
      ano: p.anoBase + Math.round(fim / 12),
      patNominal: s.pat[fim],
      patReal: s.pat[fim] / s.defl[fim],
      aporte: ap,
      rendimento: rd,
      rendimentoReal: rdReal,
      retirada: rt,
      compra: cp,
      defl: s.defl[fim],
    })
  }
  return linhas
}
