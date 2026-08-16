import api from './axios'
import type { DashboardStats, CategoryCount, ProvinceCount, RecentActivityItem } from '@/types/dashboard'

export type { DashboardStats, CategoryCount, ProvinceCount, RecentActivityItem }

export const dashboardApi = {
  getStats() {
    return api.get<DashboardStats>('/dashboard/stats')
  },
  getCategoryCounts() {
    return api.get<CategoryCount[]>('/taxonomy/categories/counts')
  },
  getProvinceCounts() {
    return api.get<ProvinceCount[]>('/provinces/counts')
  },
  getRecentActivity() {
    return api.get<RecentActivityItem[]>('/dashboard/recent-activity')
  },
}
