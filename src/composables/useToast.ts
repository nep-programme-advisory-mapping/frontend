/**
 * Composable for managing a stack of temporary toast notifications.
 * Push a message with `push(text)`, it auto-dismisses after `duration` ms.
 */
import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
}

export function useToast(duration = 3000) {
  const toasts = ref<Toast[]>([])

  function push(text: string) {
    if (toasts.value.some(t => t.text === text)) return

    const id = Date.now() + Math.random()
    toasts.value.push({ id, text })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, push }
}
