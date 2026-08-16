<script setup lang="ts">
import type { EntryDetail } from '@/types/entryDetail'
import { formatRelativeTime } from '@/utils/format'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  entry: EntryDetail
  status: 'verified' | 'unverified' | null
  marking: boolean
  isAdmin: boolean
}>()

defineEmits<{
  'mark-verified': []
  'open-report': []
  back: []
}>()

const authStore = useAuthStore()
</script>

<template>
  <div class="page-head flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <div class="flex items-center gap-2.5 mb-1.5 flex-wrap">
        <h1 class="text-xl font-bold">{{ entry.name }}</h1>
        <BaseBadge :tone="status === 'verified' ? 'green' : 'amber'" dot>{{ status === 'verified' ? 'Verified' :
          'Unverified' }}</BaseBadge>
      </div>
      <p class="text-xs text-slate-500">{{ entry.organisationName }} · Programme ID #{{ entry.id.replace('entry-', '') }} ·
        Last updated {{ formatRelativeTime(entry.lastUpdated) }}</p>
    </div>

    <div class="flex items-center gap-2.5 flex-wrap shrink-0">
      <button
        type="button"
        class="px-4 py-2.5 bg-[#0F5A4D] hover:bg-[#0c483d] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
        @click.stop.prevent="$emit('open-report')"
      >
        <BaseIcon name="file" :size="15" /> Generate Report
      </button>
      <BaseButton v-if="status === 'unverified' && isAdmin" variant="secondary" class="inline-flex items-center gap-1.5" :disabled="marking" @click="$emit('mark-verified')">
        <BaseIcon name="check" :size="15" /> {{ marking ? 'Marking…' : 'Mark as verified' }}
      </BaseButton>
      <BaseButton variant="secondary" class="inline-flex items-center gap-1.5" @click="$emit('back')">
        <BaseIcon name="arrowLeft" :size="15" /> {{ (authStore.isAdmin || authStore.userRole === 'nep_coordinator') ? 'Back to map' : 'Back to Dashboard' }}
      </BaseButton>
    </div>
  </div>
</template>
