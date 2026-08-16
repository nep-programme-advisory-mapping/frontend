<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { PolicyDocument } from '@/types/policy'

defineProps<{
  items: PolicyDocument[]
  canEdit?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', doc: PolicyDocument): void
  (e: 'delete', doc: PolicyDocument): void
  (e: 'view', doc: PolicyDocument): void
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full table-fixed text-left border-collapse hidden md:table">
      <thead>
        <tr class="border-b border-[var(--line)]">
          <th class="w-[30%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Document</th>
          <th class="w-[30%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Issuing authority</th>
          <th class="w-[12%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Version</th>
          <th class="w-[12%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Status</th>
          <th class="w-[16%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] whitespace-nowrap bg-[var(--bg)] text-right">Action</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-[var(--line-soft)]">
        <tr v-for="d in items" :key="d.id" class="transition-colors duration-150 hover:bg-[var(--teal-50)]">
          <td class="px-4 py-3.5 align-middle">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-6 h-6 rounded bg-[var(--line-soft)] flex items-center justify-center shrink-0">
                <BaseIcon name="book" size="12" class="text-[var(--ink-400)]" />
              </span>
              <div class="min-w-0">
                <span class="text-[13px] truncate block leading-tight"
                  :class="d.status === 'active' ? 'font-semibold text-[var(--ink-900)]' : 'text-[var(--ink-500)]'" :title="d.title">
                  {{ d.title }}
                </span>
                <span class="text-xs text-[var(--ink-400)]">{{ formatDate(d.date) }}</span>
              </div>
            </div>
          </td>

          <td class="px-4 py-3.5 align-middle">
            <span class="text-[13px] text-[var(--ink-600)] truncate block leading-tight" :title="d.authority">
              {{ d.authority }}
            </span>
          </td>

          <td class="px-4 py-3.5 align-middle">
            <span class="text-[13px] text-[var(--ink-600)] truncate block leading-tight">
              {{ d.version }}
            </span>
          </td>

          <td class="px-4 py-3.5 align-middle">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
              :class="d.status === 'active' ? 'bg-[var(--green-100)] text-[var(--green-700)]' : 'bg-[var(--line-soft)] text-[var(--ink-500)]'">
              <span class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="d.status === 'active' ? 'bg-[var(--green-700)]' : 'bg-[var(--ink-400)]'"></span>
              {{ d.status === 'active' ? 'Active' : 'Superseded' }}
            </span>
          </td>

          <td class="px-4 py-3.5 align-middle text-right">
            <div class="inline-flex items-center gap-1">
              <button
                class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                title="View document" @click.stop="emit('view', d)">
                <BaseIcon name="eye" :size="14" />
              </button>
              <button v-if="canEdit"
                class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                title="Edit document" @click.stop="emit('edit', d)">
                <BaseIcon name="edit" :size="14" />
              </button>
              <button v-if="canDelete"
                class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
                title="Delete document" @click.stop.prevent="emit('delete', d)">
                <BaseIcon name="trash" :size="14" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex flex-col md:hidden">
    <div v-for="d in items" :key="d.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="w-7 h-7 rounded bg-[var(--line-soft)] flex items-center justify-center shrink-0">
          <BaseIcon name="book" size="12" class="text-[var(--ink-400)]" />
        </span>
        <span class="text-[13px] truncate block leading-tight flex-1 min-w-0"
          :class="d.status === 'active' ? 'font-semibold text-[var(--ink-900)]' : 'text-[var(--ink-500)]'" :title="d.title">
          {{ d.title }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0"
          :class="d.status === 'active' ? 'bg-[var(--green-100)] text-[var(--green-700)]' : 'bg-[var(--line-soft)] text-[var(--ink-500)]'">
          <span class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="d.status === 'active' ? 'bg-[var(--green-700)]' : 'bg-[var(--ink-400)]'"></span>
          {{ d.status === 'active' ? 'Active' : 'Superseded' }}
        </span>
      </div>
      <div class="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 pl-9.5 text-xs text-[var(--ink-500)]">
        <span class="truncate min-w-0 max-w-[200px]" :title="d.authority">{{ d.authority }}</span>
        <span class="text-[var(--ink-400)]">v{{ d.version }}</span>
        <span class="text-[var(--ink-400)] whitespace-nowrap">{{ formatDate(d.date) }}</span>
      </div>
      <div class="flex gap-1.5 mt-3 pl-9.5">
        <button
          class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
          title="View document" @click.stop="emit('view', d)">
          <BaseIcon name="eye" :size="14" />
        </button>
        <button v-if="canEdit"
          class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
          title="Edit document" @click.stop="emit('edit', d)">
          <BaseIcon name="edit" :size="14" />
        </button>
        <button v-if="canDelete"
          class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
          title="Delete document" @click.stop.prevent="emit('delete', d)">
          <BaseIcon name="trash" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
