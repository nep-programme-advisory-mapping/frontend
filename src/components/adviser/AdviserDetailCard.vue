<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adviserApi } from '@/api/adviser.api'
import { unwrapData } from '@/utils/apiHelpers'
import { useAdviserStore } from '@/stores/adviser'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Submission } from '@/types/adviser'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const props = defineProps<{
  id: number
}>()

const emit = defineEmits<{
  back: []
}>()

const adviserStore = useAdviserStore()
const submission = ref<Submission | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await adviserApi.getById(props.id)
    submission.value = unwrapData(res.data)
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Failed to load submission.'
  } finally {
    loading.value = false
  }
  adviserStore.loadCoordinators()
})

// ── Status helpers ──────────────────────────────────────────────────────────
const statusMeta = computed(() => {
  if (!submission.value) return { label: '', dot: '', bg: '', text: '', border: '' }
  const s = submission.value.status
  if (s === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED) {
    return { label: 'Advice delivered', dot: '#16a34a', bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }
  }
  // 'pending' and 'submitted_for_review' both show as "Submitted for review"
  return { label: 'Submitted for review', dot: '#d97706', bg: '#fef3e2', text: '#b45309', border: '#fde68a' }
})

function ucFirst(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

const scopeDisplay = computed(() => {
  if (!submission.value) return ''
  const s = submission.value
  if (!s.analysis_scope_detail) return ucFirst(s.analysis_scope)
  return `${ucFirst(s.analysis_scope)}: ${s.analysis_scope_detail}`
})

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const hasAnalysis = computed(() => {
  if (!submission.value) return false
  const s = submission.value
  return !!(s.section_profile || s.section_gaps || s.section_coordinators_notes)
})

const scopeIcon = computed(() => {
  if (!submission.value) return 'globe'
  const scope = submission.value.analysis_scope
  if (scope === 'geographic subset' || scope === 'geographic') return 'map'
  if (scope === 'thematic subset' || scope === 'thematic') return 'list'
  return 'globe'
})
</script>

<template>
  <!-- Loading -->
  <div
    v-if="loading"
    class="flex items-center justify-center py-24 text-sm text-[var(--ink-400)] gap-3"
  >
    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    Loading submission…
  </div>

  <!-- Error -->
  <div
    v-else-if="error"
    class="flex flex-col items-center justify-center py-20 text-center"
  >
    <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
      <BaseIcon name="alert" size="22" />
    </div>
    <p class="text-sm font-semibold text-red-700">Failed to load submission</p>
    <p class="mt-1 text-xs text-[var(--ink-400)]">{{ error }}</p>
    <button
      type="button"
      @click="emit('back')"
      class="mt-5 px-4 py-2 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--ink-600)] hover:bg-[var(--bg)] transition-colors"
    >
      Go back
    </button>
  </div>

  <!-- Content -->
  <div v-else-if="submission" class="max-w-3xl mx-auto space-y-6">
    <!-- Back link + Status -->
    <div class="flex items-center justify-between gap-4">
      <button
        type="button"
        @click="emit('back')"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
        </svg>
        Back to list
      </button>

      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide leading-none whitespace-nowrap"
        :style="{
          background: statusMeta.bg,
          color: statusMeta.text,
          border: `1px solid ${statusMeta.border}`,
        }"
      >
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :style="{ background: statusMeta.dot }"
        />
        {{ statusMeta.label }}
      </span>
    </div>

    <!-- Document Header Card -->
    <div class="bg-white border border-[var(--line-soft)] rounded-[var(--radius)] shadow-sm overflow-hidden">
      <div class="p-6 sm:p-8">
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white shrink-0 shadow-[0_3px_8px_rgba(10,61,57,0.2)]"
          >
            <BaseIcon name="file" :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="text-lg font-bold text-[var(--ink-900)] leading-snug">{{ submission.document_name }}</h1>
            <p class="mt-1 text-xs text-[var(--ink-400)]">
              Submitted by
              <span class="font-semibold text-[var(--ink-700)]">{{ submission.submitting_party }}</span>
              · {{ formatDate(submission.submitted_at) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="bg-white border border-[var(--line-soft)] rounded-[var(--radius)] shadow-sm overflow-hidden">
      <div class="px-6 sm:px-8 py-4 border-b border-[var(--line-soft)]">
        <h2 class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)]">Submission Details</h2>
      </div>
      <div class="px-6 sm:px-8 py-2 divide-y divide-[var(--line-soft)]">
        <!-- Scope -->
        <div class="flex items-center justify-between py-3.5">
          <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)]">
            <BaseIcon :name="scopeIcon" :size="14" />
            Analysis Scope
          </span>
          <span class="text-sm font-medium text-[var(--ink-900)] text-right max-w-[55%]">{{ scopeDisplay }}</span>
        </div>

        <!-- Assigned to -->
        <div class="flex items-center justify-between py-3.5">
          <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)]">
            <BaseIcon name="users" :size="14" />
            Assigned to
          </span>
          <span class="text-sm font-medium text-[var(--ink-900)]">
            {{ adviserStore.coordinatorLabel(submission.assign_to_staff_user_id ?? null) }}
          </span>
        </div>

        <!-- Submitted -->
        <div class="flex items-center justify-between py-3.5">
          <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)]">
            <BaseIcon name="upload" :size="14" />
            Submitted
          </span>
          <span class="text-sm font-medium text-[var(--ink-900)]">{{ formatDateTime(submission.submitted_at) }}</span>
        </div>

        <!-- Delivered (conditional) -->
        <div v-if="submission.delivered_at" class="flex items-center justify-between py-3.5">
          <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)]">
            <BaseIcon name="check" :size="14" />
            Delivered
          </span>
          <span class="text-sm font-medium text-[var(--ink-900)]">{{ formatDateTime(submission.delivered_at) }}</span>
        </div>

        <!-- Status -->
        <div class="flex items-center justify-between py-3.5">
          <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)]">
            <BaseIcon name="bolt" :size="14" />
            Status
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold leading-none"
            :style="{
              background: statusMeta.bg,
              color: statusMeta.text,
            }"
          >
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :style="{ background: statusMeta.dot }"
            />
            {{ statusMeta.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Analysis Sections -->
    <div v-if="hasAnalysis" class="space-y-4">
      <div class="flex items-center gap-2 mb-1">
        <BaseIcon name="file" :size="16" />
        <h2 class="text-sm font-bold text-[var(--ink-900)]">Analysis Results</h2>
      </div>

      <!-- Profile Section -->
      <div
        v-if="submission.section_profile"
        class="bg-white border border-[var(--line-soft)] rounded-[var(--radius)] shadow-sm overflow-hidden"
      >
        <div class="px-6 sm:px-8 py-3.5 border-b border-[var(--line-soft)] bg-[var(--bg)]">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">P</span>
            <h3 class="text-xs font-bold text-[var(--ink-900)]">Profile</h3>
          </div>
        </div>
        <div class="px-6 sm:px-8 py-4">
          <p class="text-sm text-[var(--ink-700)] leading-relaxed whitespace-pre-wrap">{{ submission.section_profile }}</p>
        </div>
      </div>

      <!-- Gaps Section -->
      <div
        v-if="submission.section_gaps"
        class="bg-white border border-[var(--line-soft)] rounded-[var(--radius)] shadow-sm overflow-hidden"
      >
        <div class="px-6 sm:px-8 py-3.5 border-b border-[var(--line-soft)] bg-[var(--bg)]">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-[10px] font-bold">G</span>
            <h3 class="text-xs font-bold text-[var(--ink-900)]">Gaps</h3>
          </div>
        </div>
        <div class="px-6 sm:px-8 py-4">
          <p class="text-sm text-[var(--ink-700)] leading-relaxed whitespace-pre-wrap">{{ submission.section_gaps }}</p>
        </div>
      </div>

      <!-- Coordinator Notes Section -->
      <div
        v-if="submission.section_coordinators_notes"
        class="bg-white border border-[var(--line-soft)] rounded-[var(--radius)] shadow-sm overflow-hidden"
      >
        <div class="px-6 sm:px-8 py-3.5 border-b border-[var(--line-soft)] bg-[var(--bg)]">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-[10px] font-bold">N</span>
            <h3 class="text-xs font-bold text-[var(--ink-900)]">Coordinator Notes</h3>
          </div>
        </div>
        <div class="px-6 sm:px-8 py-4">
          <p class="text-sm text-[var(--ink-700)] leading-relaxed whitespace-pre-wrap">{{ submission.section_coordinators_notes }}</p>
        </div>
      </div>
    </div>

    <!-- Pending State -->
    <div
      v-else
      class="bg-white border border-[var(--line-soft)] rounded-[var(--radius)] shadow-sm overflow-hidden"
    >
      <div class="flex flex-col items-center justify-center py-12 px-8 text-center">
        <div
          class="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4"
        >
          <svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-sm font-bold text-[var(--ink-900)]">Analysis Pending</h3>
        <p class="mt-1 text-xs text-[var(--ink-400)] max-w-sm">
          A coordinator will review this submission and deliver a draft coordination advisory note.
        </p>
      </div>
    </div>
  </div>
</template>