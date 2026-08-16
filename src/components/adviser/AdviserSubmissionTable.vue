<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Submission, SubmissionStatus } from '@/types/adviser'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const props = defineProps<{
  submissions: Submission[]
  coordinatorMap?: Record<number, string>
}>()

const emit = defineEmits<{
  open: [id: number]
}>()

function statusLabel(status: SubmissionStatus): string {
  if (status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED) return 'Advice delivered'
  return 'Submitted for review'
}

function statusClass(status: SubmissionStatus): string {
  if (status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  return 'bg-amber-50 text-amber-700 border border-amber-200'
}

function coordinatorLabel(sub: Submission): string {
  if (sub.coordinator?.name) return sub.coordinator.name
  if (!sub.coordinator_id) return 'Unassigned'
  return props.coordinatorMap?.[sub.coordinator_id] ?? `User #${sub.coordinator_id}`
}

function formatScope(s: Submission): string {
  const base = s.analysis_scope ? s.analysis_scope.charAt(0).toUpperCase() + s.analysis_scope.slice(1) : '—'
  return s.analysis_scope_detail ? `${base}: ${s.analysis_scope_detail}` : base
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const months = Math.floor(days / 30)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  return `${months} month${months !== 1 ? 's' : ''} ago`
}
</script>

<template>
  <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden">
    <!-- Desktop Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse table-fixed hidden md:table">
        <thead>
          <tr class="border-b border-[var(--line)]">
            <th
              class="w-[24%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">
              Submitting party</th>
            <th
              class="w-[24%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">
              Document</th>
            <th
              class="w-[12%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">
              Analysis scope</th>
            <th
              class="w-[16%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">
              Status</th>
            <th
              class="w-[12%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">
              Assigned to</th>
            <th
              class="w-[12%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] whitespace-nowrap bg-[var(--bg)] text-right">
              Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in submissions" :key="sub.id" @click="emit('open', sub.id)"
            class="border-b border-[var(--line-soft)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--teal-50)] cursor-pointer">
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <span class="text-[13.5px] font-semibold text-[var(--ink-900)] truncate block leading-tight"
                :title="sub.programme_entry?.programme_name">{{
                  sub.programme_entry?.programme_name || `Entry #${sub.programme_entry_id}` }}</span>
              <span class="text-xs text-[var(--ink-400)]" :title="sub.submitting_party">{{ sub.submitting_party
              }}</span>
            </td>

            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="w-6 h-6 rounded bg-[var(--line-soft)] flex items-center justify-center shrink-0 border border-[var(--line)]">
                  <BaseIcon name="file" size="12" class="text-[var(--ink-400)]" />
                </span>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs text-[var(--ink-600)] truncate leading-none" :title="sub.document_name">{{
                    sub.document_name }}</span>
                  <span class="text-xs text-[var(--ink-400)]">{{ timeAgo(sub.submitted_at) }}</span>
                </div>
              </div>
            </td>

            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <span class="text-xs text-[var(--ink-600)] truncate block leading-tight" :title="formatScope(sub)">{{
                formatScope(sub) }}</span>
            </td>

            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold tracking-normal whitespace-nowrap"
                :class="statusClass(sub.status)">
                <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="sub.status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                {{ statusLabel(sub.status) }}
              </span>
            </td>

            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <span class="text-xs truncate block leading-tight"
                :class="coordinatorLabel(sub) === 'Unassigned' ? 'text-[var(--ink-400)] italic' : 'text-[var(--ink-600)]'"
                :title="coordinatorLabel(sub)">
                {{ coordinatorLabel(sub) }}
              </span>
            </td>

            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle text-right">
              <button
                class="px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors whitespace-nowrap"
                @click.stop="emit('open', sub.id)">
                {{ sub.status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED ? 'View' : 'Open' }} →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="flex flex-col md:hidden">
      <div v-for="sub in submissions" :key="sub.id" @click="emit('open', sub.id)"
        class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0 cursor-pointer active:bg-[var(--teal-50)] transition-colors">
        <div class="flex items-center gap-2.5">
          <span
            class="w-[34px] h-[34px] rounded-[9px] bg-[var(--teal-100)] flex items-center justify-center text-[var(--teal-800)] text-[11px] font-bold tracking-wide shrink-0">
            <BaseIcon name="file" size="14" />
          </span>
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="text-[13.5px] font-semibold text-[var(--ink-900)] truncate" :title="sub.submitting_party">{{
              sub.submitting_party }}</span>
            <span class="text-xs text-[var(--ink-400)] truncate" :title="sub.document_name">{{ sub.document_name
            }}</span>
          </div>
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0"
            :class="statusClass(sub.status)">
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="sub.status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            {{ statusLabel(sub.status) }}
          </span>
        </div>
        <div class="flex items-center flex-wrap gap-2 mt-2.5 pl-11">
          <span class="text-xs text-[var(--ink-600)] min-w-0 max-w-[180px] truncate" :title="formatScope(sub)">{{
            formatScope(sub) }}</span>
          <span class="text-xs text-[var(--ink-400)]" :class="coordinatorLabel(sub) === 'Unassigned' ? 'italic' : ''">{{
            coordinatorLabel(sub) }}</span>
          <span class="text-xs text-[var(--ink-400)] whitespace-nowrap">{{ timeAgo(sub.submitted_at) }}</span>
        </div>
        <div class="flex gap-1.5 mt-3 pl-11">
          <button class="btn btn-secondary btn-sm" @click.stop="emit('open', sub.id)">
            <BaseIcon name="arrowLeft" :size="13" class="rotate-180" />
            {{ sub.status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED ? 'View' : 'Open' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
