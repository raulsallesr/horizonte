import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

function serviceWorkerPwa(): Plugin {
  return {
    name: 'horizonte-service-worker',
    apply: 'build',
    generateBundle(_opcoes, bundle) {
      const arquivos = [...new Set([
        './',
        './index.html',
        './manifest.webmanifest',
        './icon-horizonte.svg',
        './robots.txt',
        ...Object.values(bundle).map((item) => `./${item.fileName}`),
      ])].sort()
      const versao = createHash('sha256').update(arquivos.join('|')).digest('hex').slice(0, 12)
      const fonte = `const CACHE = 'horizonte-${versao}'
const PRECACHE = ${JSON.stringify(arquivos, null, 2)}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome.startsWith('horizonte-') && nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const requisicao = event.request
  const url = new URL(requisicao.url)
  if (requisicao.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.searchParams.has('conectividade')) {
    event.respondWith(fetch(requisicao))
    return
  }

  if (requisicao.mode === 'navigate') {
    event.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copia))
          return resposta
        })
        .catch(() => caches.match('./index.html').then((resposta) => resposta || caches.match('./'))),
    )
    return
  }

  event.respondWith(
    caches.match(requisicao, { ignoreVary: true }).then((armazenada) => armazenada || fetch(requisicao).then((resposta) => {
      if (resposta.ok) caches.open(CACHE).then((cache) => cache.put(requisicao, resposta.clone()))
      return resposta
    })),
  )
})
`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: fonte })
    },
  }
}

// base relativa: funciona em qualquer subcaminho do GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorkerPwa()],
  test: { include: ['src/**/*.test.ts'] },
})
