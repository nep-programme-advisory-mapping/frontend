<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h2 class="text-base font-semibold text-gray-800 mb-4">Recent activity</h2>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-10 bg-gray-100 rounded animate-pulse" />
    </div>

    <div v-else-if="!items.length" class="text-sm text-gray-400 py-4 text-center">
      No recent activity.
    </div>

    <ul v-else class="divide-y divide-gray-100">
      <li
        v-for="item in items"
        :key="`${item.type}-${item.id}`"
        class="flex items-center justify-between py-3 gap-4 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
        @click="navigate(item)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center uppercase">
            {{ initials(item.label) }}
          </span>
          <span class="text-sm text-gray-700 truncate">
            <template v-if="item.type === 'advisory_note'">
              Advisory note for <span class="text-teal-600 font-medium">{{ item.label }}</span> released to requesting party
            </template>
            <template v-else-if="item.type === 'programme_new'">
              <span class="text-teal-600 font-medium">{{ item.label }}</span> submitted <span class="text-gray-900 font-medium">{{ item.programme }}</span>
            </template>
            <template v-else>
              <span class="text-teal-600 font-medium">{{ item.label }}</span> updated <span class="text-gray-900 font-medium">{{ item.programme }}</span>
            </template>
          </span>
        </div>
        <span class="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">{{ timeAgo(item.occurred_at) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '@/api/dashboard.api'
import type { RecentActivityItem } from '@/types/dashboard'

const router = useRouter()
const items = ref<RecentActivityItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await dashboardApi.getRecentActivity()
    items.value = res.data
  } catch {
    // silently fail — non-critical widget
  } finally {
    loading.value = false
  }
})

function navigate(item: RecentActivityItem) {
  if (item.type === 'advisory_note') {
    router.push(`/adviser/${item.id}`)
  } else {
    // programme_new or programme_updated → go to map, highlight the entry
    const entryId = item.programme_entry_id ?? item.id
    router.push({ path: '/map', query: { entry: String(entryId) } })
  }
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}
</script>
