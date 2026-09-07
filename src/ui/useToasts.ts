import { useCallback, useEffect, useRef, useState } from 'react'
import type { StatusTone } from './tones'

export type Toast = {
  id: string
  tone: StatusTone
  title: string
  description?: string
}

/**
 * Toast state for short-lived, low-risk confirmations. Consequential
 * operations must show their accepted state in the workflow itself, never
 * only in a disappearing toast (C04 section 54).
 */
export function useToasts() {
  const [toasts, setToasts] = useState<readonly Toast[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'> & { id?: string; durationMs?: number }) => {
      const id =
        toast.id ??
        `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const duration = toast.durationMs ?? 4000
      setToasts((current) => [...current, { ...toast, id }])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
      return id
    },
    [dismiss],
  )

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer)
    },
    [],
  )

  return { toasts, push, dismiss }
}
