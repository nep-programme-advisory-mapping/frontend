import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import type { AppNotification } from '@/types/notification'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

export function useNotificationBell() {
  const router = useRouter()
  const store = useNotificationStore()

  const open = ref(false)
  const bellRef = ref<HTMLElement | null>(null)
  const isRinging = ref(false)

  const seenIds = new Set<string>()

  function onOutsideClick(e: MouseEvent) {
    if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }

  function triggerRing() {
    isRinging.value = false
    requestAnimationFrame(() => { isRinging.value = true })
    setTimeout(() => { isRinging.value = false }, 1000)
  }

  function navigateTo(n: AppNotification) {
    if (n.type === 'adviser_submission_assigned' && n.advisory_note_id) {
      router.push(`/adviser/${n.advisory_note_id}`)
    } else if (n.type === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED && n.programme_entry_id) {
      router.push({ name: 'adviser-entry-detail', params: { entryId: String(n.programme_entry_id) } })
    } else if (n.programme_entry_id) {
      router.push({ path: '/entries/new', query: { id: n.programme_entry_id } })
    }
  }

  async function handleNotificationClick(n: AppNotification) {
    await store.markRead(n.id)
    open.value = false
    navigateTo(n)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function checkForNew() {
    for (const item of store.items) {
      if (item.read_at) continue
      if (seenIds.has(item.id)) continue
      seenIds.add(item.id)
      triggerRing()
      break
    }
  }

  // Watch items — fires immediately whenever a new notification is pushed (real-time or fetched)
  watch(() => store.items.length, checkForNew)
  watch(() => store.items[0]?.id, checkForNew)

  watch(open, (isOpen) => {
    if (isOpen && !store.hasLoaded) void store.fetchNotifications()
  })

  onMounted(() => {
    document.addEventListener('click', onOutsideClick)
    store.items.filter(n => n.read_at).forEach(n => seenIds.add(n.id))
    // Seed seenIds for already-loaded items so only future arrivals ring
    store.items.forEach(n => seenIds.add(n.id))
  })

  onUnmounted(() => {
    document.removeEventListener('click', onOutsideClick)
  })

  return {
    store,
    open,
    bellRef,
    isRinging,
    handleNotificationClick,
    formatTime,
  }
}
