<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseBadge from '@/components/common/BaseBadge.vue'

import { useMapStore } from '@/stores/map'
import { useEntriesStore } from '@/stores/entries.store'

const router = useRouter()
const mapStore = useMapStore()
const entriesStore = useEntriesStore()

function formatAudiences(activities: any[]): string[] {
  if (!activities || !activities.length) return []
  const unique = new Set<string>()
  activities.forEach((a: any) => {
    if (a.inclusion_group && a.inclusion_type) {
      unique.add(`${a.inclusion_group} (${a.inclusion_type})`)
    } else if (a.inclusion_group) {
      unique.add(a.inclusion_group)
    }
  })
  return Array.from(unique).sort()
}

function getProvinces(entry: any): string[] {
  if (!entry.locations || !entry.locations.length) return []
  const unique = new Set<string>()
  entry.locations.forEach((l: any) => {
    const pName = l.province?.province_name ?? l.province_name ?? ''
    if (pName) unique.add(pName)
  })
  return Array.from(unique).sort()
}

function formatBudgetBand(b: any): string {
  if (!b) return '—'
  if (typeof b === 'string') return b
  if (typeof b === 'object' && b.label) return b.label
  return '—'
}
</script>

<template>
  <!-- Desktop Table -->
  <div class="w-full overflow-x-auto">
    <table class="w-full table-fixed text-left border-collapse hidden md:table">
      <thead>
        <tr class="border-b border-[var(--line)]">
          <th class="w-[25%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)] cursor-pointer select-none hover:text-[var(--ink-700)] transition-colors" @click="mapStore.toggleSort('name')">
            Programme {{ mapStore.sortKey === 'name' ? (mapStore.sortDir === 'asc' ? '↑' : '↓') : '' }}
          </th>
          <th class="w-[7%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Status</th>
          <th class="w-[20%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Core activities</th>
          <th class="w-[20%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Audiences</th>
          <th class="w-[18%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Provinces</th>
          <th class="w-[10%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] whitespace-nowrap bg-[var(--bg)] text-right">Action</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--line-soft)]">
        <tr v-for="e in mapStore.paged" :key="e.id" class="cursor-pointer transition-colors duration-150 hover:bg-[var(--teal-50)]" @click="router.push({ name: 'entry-detail', params: { id: String(e.id) } })">
          <td class="px-4 py-3.5">
            <div class="font-semibold text-[var(--ink-900)]">{{ e.programme_name ?? e.name }}</div>
            <div class="text-xs text-[var(--ink-400)]">{{ formatBudgetBand(e.budget_band ?? e.budgetBand) }}</div>
          </td>
          <td class="px-4 py-3.5">
            <BaseBadge :tone="entriesStore.statusOf(e) === 'verified' ? 'green' : 'amber'">
              {{ entriesStore.statusOf(e) === 'verified' ? 'Verified' : 'Unverified' }}
            </BaseBadge>
          </td>
          <td class="px-4 py-3.5">
            <div class="flex flex-wrap gap-1">
              <template v-if="mapStore.primaryActivities(e).length > 0">
                <BaseBadge v-for="code in mapStore.primaryActivities(e).slice(0, 5)" :key="code" tone="teal">
                  {{ code }}
                </BaseBadge>
                <BaseBadge v-if="mapStore.primaryActivities(e).length > 5" tone="gray">
                  +{{ mapStore.primaryActivities(e).length - 5 }}
                </BaseBadge>
              </template>
              <span v-else class="text-xs text-[var(--ink-300)]">—</span>
            </div>
          </td>
          <td class="px-4 py-3.5 text-xs text-[var(--ink-600)]">
            {{ formatAudiences(e.activities).slice(0, 2).join(', ') || '—' }}
            <span v-if="formatAudiences(e.activities).length > 2" class="text-[var(--ink-400)] font-medium ml-1"> +{{ formatAudiences(e.activities).length - 2 }}</span>
          </td>
          <td class="px-4 py-3.5">
            <div class="flex flex-wrap gap-1">
              <span v-for="p in getProvinces(e).slice(0, 2)" :key="p" class="px-2 py-0.5 rounded-md bg-[var(--line-soft)] text-[var(--ink-600)] text-xs font-medium border border-[var(--line)]">{{ p }}</span>
              <span v-if="getProvinces(e).length > 2" class="px-1.5 py-0.5 rounded-md bg-[var(--line-soft)]/80 text-[var(--ink-500)] text-xs font-semibold"> +{{ getProvinces(e).length - 2 }}</span>
              <span v-if="!getProvinces(e).length" class="text-xs text-[var(--ink-300)]">—</span>
            </div>
          </td>
          <td class="px-4 py-3.5 text-right whitespace-nowrap">
            <button
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors whitespace-nowrap"
              @click.stop="router.push({ name: 'entry-detail', params: { id: String(e.id) } })"
            >
              View →
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile Cards -->
  <div class="flex flex-col md:hidden">
    <div v-for="e in mapStore.paged" :key="e.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0 cursor-pointer transition-colors duration-150 active:bg-[var(--teal-50)]" @click="router.push({ name: 'entry-detail', params: { id: String(e.id) } })">
      <div class="font-semibold text-[var(--ink-900)] text-sm">{{ e.programme_name ?? e.name }}</div>
      <div class="flex items-center gap-2 mt-1">
        <BaseBadge :tone="entriesStore.statusOf(e) === 'verified' ? 'green' : 'amber'">
          {{ entriesStore.statusOf(e) === 'verified' ? 'Verified' : 'Unverified' }}
        </BaseBadge>
        <span class="text-xs text-[var(--ink-400)]">{{ formatBudgetBand(e.budget_band ?? e.budgetBand) }}</span>
      </div>
      <div class="flex flex-wrap gap-1 mt-2">
        <template v-if="mapStore.primaryActivities(e).length > 0">
          <BaseBadge v-for="code in mapStore.primaryActivities(e).slice(0, 3)" :key="code" tone="teal">{{ code }}</BaseBadge>
          <BaseBadge v-if="mapStore.primaryActivities(e).length > 3" tone="gray">+{{ mapStore.primaryActivities(e).length - 3 }}</BaseBadge>
        </template>
      </div>
      <div class="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-[var(--ink-500)]">
        <span>{{ formatAudiences(e.activities).slice(0, 1).join(', ') || '—' }}</span>
        <span>{{ getProvinces(e).slice(0, 2).join(', ') || '—' }}</span>
      </div>
      <button
        class="mt-2 px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors"
        @click.stop="router.push({ name: 'entry-detail', params: { id: String(e.id) } })"
      >
        View →
      </button>
    </div>
  </div>
</template>
