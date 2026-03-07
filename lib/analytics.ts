declare global {
  interface Window {
    goatcounter?: {
      count: (opts: { path: string; title?: string; event: boolean }) => void
    }
  }
}

export function trackEvent(name: string) {
  if (typeof window === 'undefined' || !window.goatcounter) return
  window.goatcounter.count({ path: name, event: true })
}
