import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { preview } from 'vite'

const pastaArtefatos = new URL('../artifacts/', import.meta.url)
const limitesCategorias = {
  performance: 0.8,
  accessibility: 0.95,
  'best-practices': 0.9,
  seo: 0.9,
}
const limitesMetricas = {
  'first-contentful-paint': 2_500,
  // Margem curta para a variação entre runners; o score de performance continua obrigatório.
  'largest-contentful-paint': 3_200,
  'total-blocking-time': 350,
  'cumulative-layout-shift': 0.1,
}

const servidor = await preview({
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})
const navegadorPlaywright = chromium.executablePath()
const caminhoChrome = process.env.CHROME_PATH || (existsSync(navegadorPlaywright) ? navegadorPlaywright : undefined)
let chrome

try {
  chrome = await launch({
    chromePath: caminhoChrome,
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
    ],
  })
  const resultado = await lighthouse('http://127.0.0.1:4173/', {
    port: chrome.port,
    output: ['html', 'json'],
    logLevel: 'error',
    onlyCategories: Object.keys(limitesCategorias),
  })
  if (!resultado) throw new Error('O Lighthouse não retornou um relatório.')

  const [relatorioHtml, relatorioJson] = resultado.report
  await mkdir(pastaArtefatos, { recursive: true })
  await writeFile(new URL('lighthouse.html', pastaArtefatos), relatorioHtml)
  await writeFile(new URL('lighthouse.json', pastaArtefatos), relatorioJson)

  const falhas = []
  const requisicoes = resultado.lhr.audits['network-requests']?.details?.items ?? []
  const origemAplicacao = 'http://127.0.0.1:4173'
  const externas = requisicoes.filter((item) => {
    try {
      return new URL(item.url).origin !== origemAplicacao
    } catch {
      return true
    }
  })
  const interferenciasConhecidas = externas.filter((item) => {
    try {
      return new URL(item.url).hostname.endsWith('kaspersky-labs.com')
    } catch {
      return false
    }
  })
  const externasInesperadas = externas.filter((item) => !interferenciasConhecidas.includes(item))

  for (const [categoria, minimo] of Object.entries(limitesCategorias)) {
    const nota = resultado.lhr.categories[categoria]?.score ?? 0
    console.log(`${categoria}: ${Math.round(nota * 100)}`)
    if (categoria === 'best-practices' && interferenciasConhecidas.length > 0) {
      console.warn('best-practices: medição local contaminada por injeção conhecida do Kaspersky; o limite permanece obrigatório em ambiente limpo.')
      continue
    }
    if (nota < minimo) falhas.push(`${categoria} ${Math.round(nota * 100)} < ${minimo * 100}`)
  }
  for (const [auditoria, maximo] of Object.entries(limitesMetricas)) {
    const valor = resultado.lhr.audits[auditoria]?.numericValue ?? Number.POSITIVE_INFINITY
    console.log(`${auditoria}: ${Math.round(valor * 100) / 100}`)
    if (valor > maximo) falhas.push(`${auditoria} ${Math.round(valor)} > ${maximo}`)
  }

  if (externasInesperadas.length > 0) {
    falhas.push(`requisições externas inesperadas: ${externasInesperadas.map((item) => item.url).join(', ')}`)
  }

  const transferencia = requisicoes
    .filter((item) => {
      try {
        return new URL(item.url).origin === origemAplicacao
      } catch {
        return false
      }
    })
    .reduce((total, item) => total + (Number(item.transferSize) || 0), 0)
  console.log(`transferência total: ${Math.round(transferencia / 1024)} KiB`)
  if (transferencia > 1_000_000) falhas.push(`transferência ${transferencia} > 1000000 bytes`)

  if (falhas.length > 0) throw new Error(`Orçamento Lighthouse excedido:\n- ${falhas.join('\n- ')}`)
} finally {
  await chrome?.kill()
  await servidor.close()
}
