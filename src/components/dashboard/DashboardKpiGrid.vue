<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <KpiCard
        icon="users"
        iconTone="teal"
        :value="loading ? '...' : stats?.total_organizations ?? 0"
        label="Member organisations"
      />
      <KpiCard
        icon="trend"
        iconTone="teal"
        :value="loading ? '...' : stats?.total_program_entries ?? 0"
        label="Programme entries mapped"
      />
      <KpiCard
        icon="alert"
        iconTone="amber"
        :value="loading ? '...' : stats?.unverified_program_entries ?? 0"
        label="Entries unverified (18mo+)"
      >
        <template #badge>
          <BaseBadge tone="amber">Review</BaseBadge>
        </template>
      </KpiCard>
      <KpiCard
        icon="bolt"
        iconTone="indigo"
        :value="loading ? '...' : awaitingReviewCount"
        label="Advisory notes awaiting review"
      >
        <template #badge>
          <BaseBadge tone="green">{{ loading ? '...' : totalAdvisoryNotesCount }} total</BaseBadge>
        </template>
      </KpiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import KpiCard from '@/components/KpiCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { dashboardApi, type DashboardStats } from '@/api/dashboard.api'
import { useAdviserStore } from '@/stores/adviser'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)
const adviserStore = useAdviserStore()

const awaitingReviewCount = computed(() => {
  if (adviserStore.submissions.length > 0) {
    return adviserStore.submissions.filter(s => s.status !== ADVISORY_NOTE_STATUS.ADVICE_DELIVERED).length
  }
  return stats.value?.coordinator_advisory_notes ?? stats.value?.total_advisory_notes ?? 0
})

const totalAdvisoryNotesCount = computed(() => {
  return stats.value?.total_advisory_notes ?? adviserStore.submissions.length ?? 0
})

onMounted(async () => {
  try {
    const res = await dashboardApi.getStats()
    stats.value = res.data
    await adviserStore.fetchSubmissions()
  } catch (err) {
    console.error('Failed to fetch dashboard stats', err)
  } finally {
    loading.value = false
  }
})
</script>
