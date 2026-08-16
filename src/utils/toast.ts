import { reactive } from 'vue'

interface ToastItem {
  id: number
  message: string
  type: string
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })
let counter = 0

export function useToast() {
  function push(message: string, type = 'default', duration = 3200) {
    const existingIdx = state.items.findIndex(t => t.message === message || (type === 'error' && t.type === 'error'))
    if (existingIdx !== -1) {
      state.items.splice(existingIdx, 1)
    }
    const id = ++counter
    state.items.push({ id, message, type })
    setTimeout(() => dismiss(id), duration)
    return id
  }
  function dismiss(id: number) {
    const idx = state.items.findIndex((t) => t.id === id)
    if (idx !== -1) state.items.splice(idx, 1)
  }
  return {
    toasts: state.items,
    success: (msg: string, d?: number) => push(msg, 'success', d),
    error: (msg: string, d?: number) => push(msg, 'error', d),
    info: (msg: string, d?: number) => push(msg, 'default', d),
    dismiss,
  }
}
