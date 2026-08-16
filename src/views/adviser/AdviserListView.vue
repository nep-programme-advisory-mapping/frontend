<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import AdviserSubmissionTable from '@/components/adviser/AdviserSubmissionTable.vue'
import { useAdviserStore } from '@/stores/adviser'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const router = useRouter()
const route = useRoute()
const adviserStore = useAdviserStore()

onMounted(() => {
  adviserStore.fetchSubmissions()
})

// ── Tabs ──────────────────────────────────────────────────────────────────────
// NB: 'submitted_for_review' here is a UI-only tab id (it never equals a real
// submission.status — the actual "awaiting review" statuses are anything
// that isn't ADVICE_DELIVERED). 'advice_delivered' doubles as both the tab id
// and the real status value, so it's driven off the shared constant.
const validTabs = ['all', 'submitted_for_review', ADVISORY_NOTE_STATUS.ADVICE_DELIVERED] as const
const _activeTab = ref<'all' | 'submitted_for_review' | typeof ADVISORY_NOTE_STATUS.ADVICE_DELIVERED>(
  validTabs.includes(route.query.tab as any) ? (route.query.tab as any) : 'submitted_for_review'
)

const filteredSubmissions = computed(() => {
  const list = adviserStore.submissions.filter(s => {
    // exclude submissions linked to a draft entry (not yet submitted by member org)
    if (s.programme_entry && !Number(s.programme_entry.is_submitted)) return false
    return true
  })
  if (_activeTab.value === 'all') return list
  if (_activeTab.value === 'submitted_for_review') return list.filter(s => s.status !== ADVISORY_NOTE_STATUS.ADVICE_DELIVERED)
  return list.filter(s => s.status === _activeTab.value)
})

const countAll = computed(() => adviserStore.submissions.filter(s => !s.programme_entry || Number(s.programme_entry.is_submitted)).length)
const countReview = computed(() => adviserStore.submissions.filter(s => (!s.programme_entry || Number(s.programme_entry.is_submitted)) && s.status !== ADVISORY_NOTE_STATUS.ADVICE_DELIVERED).length)
const countDelivered = computed(() => adviserStore.submissions.filter(s => (!s.programme_entry || Number(s.programme_entry.is_submitted)) && s.status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED).length)

// ── Navigation ────────────────────────────────────────────────────────────────
function openSubmission(id: number) {
  router.push(`/adviser/${id}`)
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="The Adviser" />
    </template>

    <!-- Page heading + CTA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 mt-2">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">The Adviser</h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Analyse any submitted document against the map and generate a draft coordination advisory note.
        </p>
      </div>
      <router-link
        to="/adviser/new"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] !text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
      >
        <BaseIcon name="plus" :size="15" />
        Submit document for analysis
      </router-link>
    </div>

    <!-- Tabs -->
    <div class="overflow-x-auto no-scrollbar -mx-1 px-1 mb-6 border-b border-slate-200">
      <div class="flex gap-1 min-w-0 w-max">
        <button
          v-for="tab in [
            { key: 'all', label: 'All Submitted', count: countAll },
            { key: 'submitted_for_review', label: 'Submitted for Review', count: countReview },
            { key: ADVISORY_NOTE_STATUS.ADVICE_DELIVERED, label: 'Advice Delivered', count: countDelivered },
          ]"
          :key="tab.key"
          type="button"
          @click="_activeTab = tab.key as any"
          class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 cursor-pointer whitespace-nowrap"
          :class="_activeTab === tab.key
            ? 'border-[#0F5A4D] text-[#0F5A4D]'
            : 'border-transparent text-slate-500 hover:text-slate-900'"
        >
          {{ tab.label }}
          <span
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium"
            :class="_activeTab === tab.key ? 'bg-teal-100 text-[#0F5A4D]' : 'bg-slate-100 text-slate-500'"
          >{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="adviserStore.loading" message="Loading submissions…" />

    <!-- Error -->
    <p v-else-if="adviserStore.error" class="py-12 text-center text-red-500 text-sm">
      {{ adviserStore.error }}
    </p>

    <!-- Empty -->
    <EmptyState
      v-else-if="filteredSubmissions.length === 0"
      title="No submissions found"
      description="Submissions will appear here once documents are submitted."
    />

    <!-- Table -->
    <AdviserSubmissionTable
      v-else
      :submissions="filteredSubmissions"
      :coordinator-map="adviserStore.coordinatorMap"
      @open="openSubmission"
    />
  </AppShell>
</template>