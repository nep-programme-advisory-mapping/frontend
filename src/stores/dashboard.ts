import { ref } from 'vue'
import { defineStore } from 'pinia'
import { dashboardApi } from '@/api/dashboard.api'

export const useDashboardStore = defineStore('dashboard', () => {
  const activityCoverage = ref<{ label: string; value: number }[]>([])
  const activityLoading = ref(true)
  const provincialCoverage = ref<{ label: string; value: number }[]>([])
  const provincialLoading = ref(true)

  async function fetchDashboardData() {
    activityLoading.value = true
    provincialLoading.value = true

    try {
      const [catRes, provRes] = await Promise.all([
        dashboardApi.getCategoryCounts(),
        dashboardApi.getProvinceCounts(),
      ])

      activityCoverage.value = catRes.data.map((c: any) => ({
        label: c.label,
        value: c.programme_count,
      }))

      provincialCoverage.value = provRes.data
        .filter((p: any) => p.programme_count > 0)
        .slice(0, 9)
        .map((p: any) => ({ label: p.province_name, value: p.programme_count }))
    } catch (err) {
      console.error('Failed to fetch dashboard coverage data', err)
    } finally {
      activityLoading.value = false
      provincialLoading.value = false
    }
  }

  return {
    activityCoverage,
    activityLoading,
    provincialCoverage,
    provincialLoading,
    fetchDashboardData,
  }
})
