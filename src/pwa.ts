export type PwaUpdate = { registration: ServiceWorkerRegistration }

export function registerServiceWorker(onUpdate?: (update: PwaUpdate) => void) {
  if (!('serviceWorker' in navigator)) return () => undefined
  let disposed = false
  void navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      const check = () => void registration.update()
      window.addEventListener('online', check)
      if (registration.waiting && !disposed) onUpdate?.({ registration })
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (
            worker.state === 'installed' &&
            navigator.serviceWorker.controller &&
            !disposed
          )
            onUpdate?.({ registration })
        })
      })
    })
    .catch(() => undefined)
  return () => {
    disposed = true
  }
}

export function activateUpdate(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
  window.location.reload()
}
