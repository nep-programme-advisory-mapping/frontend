<script setup lang="ts">
import BaseBadge from '@/components/common/BaseBadge.vue'
import type { EntryRow } from '@/types/adminProgrammes'

const props = withDefaults(defineProps<{
  entries: EntryRow[]
  loading: boolean
  error: string
  emptyMessage: string
  page?: number
  lastPage?: number
}>(), {
  page: 1,
  lastPage: 1,
})

const emit = defineEmits<{
  (e: 'continue', id: number): void
  (e: 'page-change', page: number): void
}>()
</script>

<template>
  <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden">
    <div v-if="loading" class="flex items-center justify-center py-16">
      <svg class="animate-spin h-5 w-5 text-[var(--ink-400)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
    <div v-else-if="error" class="py-12 text-center text-sm text-red-500">{{ error }}</div>
    <div v-else-if="entries.length === 0" class="py-16 text-center text-sm text-[var(--ink-400)]">{{ emptyMessage }}</div>
    <template v-else>
      <!-- Desktop table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[500px] hidden md:table">
          <thead>
            <tr class="border-b border-[var(--line)] text-xs font-semibold text-[var(--ink-400)] uppercase tracking-wider">
              <th class="text-left px-5 py-3">Programme</th>
              <th class="text-left px-5 py-3 hidden sm:table-cell">Organisation</th>
              <th class="text-left px-5 py-3 hidden lg:table-cell">Core activities</th>
              <th class="text-left px-5 py-3 hidden sm:table-cell">Updated</th>
              <th class="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--line-soft)]">
            <tr v-for="entry in entries" :key="entry.id" class="hover:bg-[var(--bg)] transition-colors">
              <td class="px-5 py-3.5">
                <div class="font-medium text-[var(--ink-900)]">{{ entry.programme_name || 'Untitled' }}</div>
                <div class="text-xs text-[var(--ink-400)] mt-0.5">{{ entry.start_year }}–{{ entry.end_year || 'ongoing' }}</div>
              </td>
              <td class="px-5 py-3.5 text-xs text-[var(--ink-500)] hidden sm:table-cell">{{ entry.organisation?.name ?? '—' }}</td>
              <td class="px-5 py-3.5 hidden lg:table-cell">
                <div class="flex flex-wrap gap-1">
                  <BaseBadge v-for="code in (entry.primaryActivities || [])" :key="code" tone="teal">{{ code }}</BaseBadge>
                  <span v-if="!entry.primaryActivities?.length" class="text-xs text-gray-300">—</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-[var(--ink-400)] hidden sm:table-cell whitespace-nowrap">{{ entry.relativeUpdated }}</td>
              <td class="px-5 py-3.5" @click.stop>
                <button class="px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors whitespace-nowrap" @click="emit('continue', entry.id)">Continue editing →</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Mobile cards -->
      <div class="flex flex-col md:hidden">
        <div v-for="entry in entries" :key="entry.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
          <div class="font-medium text-[var(--ink-900)] text-sm">{{ entry.programme_name || 'Untitled' }}</div>
          <div class="text-xs text-[var(--ink-400)] mt-1">{{ entry.start_year }}–{{ entry.end_year || 'ongoing' }}</div>
          <div class="flex items-center flex-wrap gap-2 mt-2 text-xs text-[var(--ink-500)]">
            <span v-if="entry.organisation?.name" class="truncate max-w-[160px]">{{ entry.organisation.name }}</span>
            <span class="text-[var(--ink-400)] whitespace-nowrap">{{ entry.relativeUpdated }}</span>
          </div>
          <div v-if="entry.primaryActivities?.length" class="flex flex-wrap gap-1 mt-2">
            <BaseBadge v-for="code in entry.primaryActivities.slice(0, 3)" :key="code" tone="teal">{{ code }}</BaseBadge>
            <BaseBadge v-if="entry.primaryActivities.length > 3" tone="gray">+{{ entry.primaryActivities.length - 3 }}</BaseBadge>
          </div>
          <button class="mt-2.5 px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors" @click="emit('continue', entry.id)">Continue editing →</button>
        </div>
      </div>
      <div v-if="lastPage > 1" class="flex items-center justify-between gap-3 p-3.5 px-5 border-t border-[var(--line)]">
        <span class="text-xs text-[var(--ink-400)]">Page {{ page }} of {{ lastPage }}</span>
        <div class="flex gap-0.5">
          <button class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] disabled:opacity-35 disabled:cursor-not-allowed" :disabled="page === 1" @click="emit('page-change', page - 1)">‹ Prev</button>
          <button class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] disabled:opacity-35 disabled:cursor-not-allowed" :disabled="page === lastPage" @click="emit('page-change', page + 1)">Next ›</button>
        </div>
      </div>
    </template>
  </div>
</template>
