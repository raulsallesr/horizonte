export function registrarPwa(): void {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // A aplicação continua funcional online mesmo se o navegador bloquear o Service Worker.
    })
  })
}
