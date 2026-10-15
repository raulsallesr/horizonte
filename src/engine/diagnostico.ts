import { idadeLiberdade, numeroLiberdade, patrimonioNaIdade, resultadoMeta } from './metas'
import { projetar } from './projecao'
import type { Compra, Premissas, ResultadoMeta } from './types'

const TOLERANCIA = 0.01
const LIMITE_BUSCA = 10_000_000

export interface AlternativaMeta {
  id: string
  idadePossivel: number | null
  valorMaximoHoje: number
}

export interface DiagnosticoPlano {
  nivel: 'saudavel' | 'atencao' | 'critico'
  liberdadeNoPrazo: boolean
  duraAteOHorizonte: boolean
  metasPendentes: ResultadoMeta[]
  aporteAtualHoje: number
  aporteMinimoHoje: number | null
  idadeViavel: number | null
  despesaSustentavelHoje: number | null
  alternativasMetas: AlternativaMeta[]
}

export interface ResumoPlano {
  idadeLiberdade: number | null
  patrimonioAoParar: number
  rendaSustentavel: number
  metasRealizadas: number
  totalMetas: number
  duraAteOHorizonte: boolean
}

function arredondarCima(valor: number, passo: number): number {
  return Math.ceil(valor / passo) * passo
}

function arredondarBaixo(valor: number, passo: number): number {
  return Math.floor(valor / passo) * passo
}

function substituirMeta(p: Premissas, id: string, patch: Partial<Compra>): Premissas {
  if (id === p.barco.id) return { ...p, barco: { ...p.barco, ...patch } }
  return { ...p, extras: p.extras.map((meta) => (meta.id === id ? { ...meta, ...patch } : meta)) }
}

function serieAtendePlano(p: Premissas, serie = projetar(p, 'base')): boolean {
  const patrimonioAoParar = patrimonioNaIdade(p, serie, p.idadeParar, true)
  const metasRealizadas = serie.metas.every((meta) => meta.status === 'realizada')
  return (
    patrimonioAoParar + TOLERANCIA >= numeroLiberdade(p) &&
    serie.esgotouNaFaseDeSaqueK < 0 &&
    metasRealizadas
  )
}

function buscaMenorValor(atende: (valor: number) => boolean): number | null {
  if (atende(0)) return 0

  let alto = 1_000
  while (alto < LIMITE_BUSCA && !atende(alto)) alto *= 2
  if (!atende(alto)) return null

  let baixo = 0
  for (let i = 0; i < 28; i++) {
    const meio = (baixo + alto) / 2
    if (atende(meio)) alto = meio
    else baixo = meio
  }
  return alto
}

function buscaMaiorValor(atende: (valor: number) => boolean, referencia: number): number {
  let baixo = 0
  let alto = Math.max(1_000, referencia)
  while (alto < LIMITE_BUSCA && atende(alto)) {
    baixo = alto
    alto *= 2
  }
  if (alto >= LIMITE_BUSCA && atende(alto)) return alto

  for (let i = 0; i < 28; i++) {
    const meio = (baixo + alto) / 2
    if (atende(meio)) baixo = meio
    else alto = meio
  }
  return baixo
}

export function aporteMensalHoje(p: Premissas): number {
  return p.aporteModo === 'percentual'
    ? p.salarioMensal * (p.aportePercentual / 100)
    : p.aporteFixo
}

/** Menor aporte fixo mensal, em R$ de hoje e sem aumento real, que atende o plano Base. */
export function aporteMinimoParaPlano(p: Premissas): number | null {
  const encontrado = buscaMenorValor((aporteFixo) =>
    serieAtendePlano({ ...p, aporteModo: 'fixo', aporteFixo, aumentoRealAporte: 0 }),
  )
  return encontrado === null ? null : arredondarCima(encontrado, 50)
}

/** Primeira idade inteira, a partir da escolhida, em que o plano Base fica sustentável. */
export function idadeViavelParaParar(p: Premissas): number | null {
  const inicio = Math.max(Math.ceil(p.idadeParar), Math.ceil(p.idadeAtual + 1))
  for (let idade = inicio; idade < p.idadeFinal; idade++) {
    const candidato = { ...p, idadeParar: idade }
    if (serieAtendePlano(candidato)) return idade
  }
  return null
}

/** Maior despesa mensal que preserva metas e sustentabilidade no plano Base. */
export function despesaSustentavelParaPlano(p: Premissas): number | null {
  const despesaMinimaPermitida = 1_000
  if (!serieAtendePlano({ ...p, despesaMensal: despesaMinimaPermitida })) return null

  const maximo = buscaMaiorValor(
    (despesaMensal) => serieAtendePlano({ ...p, despesaMensal }),
    Math.max(p.despesaMensal, 1_000),
  )
  return Math.max(despesaMinimaPermitida, arredondarBaixo(maximo, 50))
}

export function alternativasParaMeta(p: Premissas, meta: ResultadoMeta): AlternativaMeta {
  let idadePossivel: number | null = null
  for (let idade = Math.ceil(meta.idade + 1); idade < p.idadeFinal; idade++) {
    const candidato = substituirMeta(p, meta.id, { idade })
    if (resultadoMeta(projetar(candidato, 'base'), meta.id)?.status === 'realizada') {
      idadePossivel = idade
      break
    }
  }

  const original = meta.id === p.barco.id ? p.barco : p.extras.find((item) => item.id === meta.id)
  const valorMaximo = buscaMaiorValor(
    (valor) => {
      const candidato = substituirMeta(p, meta.id, { valor })
      return resultadoMeta(projetar(candidato, 'base'), meta.id)?.status === 'realizada'
    },
    original?.valor ?? meta.custoNominal / Math.max(meta.deflator, 1),
  )

  const valorArredondado = arredondarBaixo(valorMaximo, 1_000)
  return {
    id: meta.id,
    idadePossivel,
    valorMaximoHoje: meta.id === p.barco.id && valorArredondado < 10_000 ? 0 : valorArredondado,
  }
}

export function diagnosticarPlano(p: Premissas, serieBase = projetar(p, 'base')): DiagnosticoPlano {
  const liberdadeNoPrazo = patrimonioNaIdade(p, serieBase, p.idadeParar, true) + TOLERANCIA >= numeroLiberdade(p)
  const duraAteOHorizonte = serieBase.esgotouNaFaseDeSaqueK < 0
  const metasPendentes = serieBase.metas.filter((meta) => meta.status !== 'realizada')
  const quantidadeFalhas = Number(!liberdadeNoPrazo) + Number(!duraAteOHorizonte) + metasPendentes.length
  const nivel = quantidadeFalhas === 0 ? 'saudavel' : duraAteOHorizonte ? 'atencao' : 'critico'

  return {
    nivel,
    liberdadeNoPrazo,
    duraAteOHorizonte,
    metasPendentes,
    aporteAtualHoje: aporteMensalHoje(p),
    aporteMinimoHoje: aporteMinimoParaPlano(p),
    idadeViavel: idadeViavelParaParar(p),
    despesaSustentavelHoje: despesaSustentavelParaPlano(p),
    alternativasMetas: metasPendentes.map((meta) => alternativasParaMeta(p, meta)),
  }
}

export function resumirPlano(p: Premissas, serie = projetar(p, 'base')): ResumoPlano {
  const patrimonioAoParar = patrimonioNaIdade(p, serie, p.idadeParar, true)
  const metasRealizadas = serie.metas.filter((meta) => meta.status === 'realizada').length
  return {
    idadeLiberdade: idadeLiberdade(p, 'base'),
    patrimonioAoParar,
    rendaSustentavel: (patrimonioAoParar * (p.taxaRetirada / 100)) / 12,
    metasRealizadas,
    totalMetas: serie.metas.length,
    duraAteOHorizonte: serie.esgotouNaFaseDeSaqueK < 0,
  }
}
