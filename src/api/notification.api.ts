import api from './axios'
import type { AppNotification } from '@/types/notification'

export const notificationApi = {
  list() {
    return api.get<{ data: AppNotification[] }>('/notifications')
  },
  markRead(id: string) {
    return api.patch(`/notifications/${id}/read`)
  },
  markAllRead() {
    return api.patch('/notifications/read-all')
  },
}
