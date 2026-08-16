<script setup lang="ts">
import { ref, computed } from 'vue'
import { EDUCATION_LEVELS, INCLUSION_GROUPS } from '@/utils/format'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { ActivityRow } from '@/types/entryDetail'

const props = defineProps<{
  activityRows: ActivityRow[]
}>()

const searchQuery = ref('')

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return props.activityRows
  const q = searchQuery.value.toLowerCase().trim()
  return props.activityRows.filter(row => {
    const code = (row.code || '').toLowerCase()
    const label = (row.item?.label || '').toLowerCase()
    return code.includes(q) || label.includes(q)
  })
})
</script>

<template>
  <BaseCard class="mt-6 bg-white border-slate-100 shadow-sm relative overflow-hidden">
    <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div class="flex items-center gap-2">
        <h3 class="text-slate-800 font-bold text-base">Activities</h3>
        <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100/80 text-teal-900 border border-teal-200/50">
          {{ activityRows.length }}
        </span>
      </div>

      <!-- Quick Search Bar for long lists -->
      <div v-if="activityRows.length > 3" class="relative min-w-[200px] flex-1 sm:flex-initial">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter activities..."
          class="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
        />
        <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
    
    <!-- 2-Column Grid with Max Height Container -->
    <div
      v-if="filteredRows.length"
      class="custom-scrollbar overflow-y-auto max-h-[460px] pr-1"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="row in filteredRows"
          :key="row.code"
          class="bg-slate-50/60 border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/30 transition-all rounded-xl p-3.5 group flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start gap-2.5 mb-2.5">
              <span class="mono text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300/70 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                {{ row.code }}
              </span>
              <h4 class="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors leading-snug pt-0.5">
                {{ row.item?.label || (row as any).label || (row as any).name || (row as any).subCategory?.name || (row as any).category?.name || row.code }}
              </h4>
            </div>
          </div>

          <div class="flex flex-col gap-1.5 text-[12px] text-slate-500 font-medium pt-2.5 border-t border-slate-200/60 mt-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-slate-400 font-semibold">Activity level:</span>
              <span
                class="text-[11px] font-bold px-3 py-0.5 rounded-full border shadow-2xs transition-all"
                :class="row.primary ? 'text-teal-800 bg-teal-100/90 border-teal-300/70' : 'text-slate-700 bg-slate-100 border-slate-300/70'"
              >
                {{ row.primary ? 'Core' : 'Supporting' }}
              </span>
            </div>

            <div v-if="row.inclusion" class="flex items-center gap-1.5 flex-wrap">
              <span class="text-slate-400 font-semibold">Audience:</span>
              <span class="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 text-[11px]">
                {{ INCLUSION_GROUPS[row.inclusion.group] }} ({{ row.inclusion.type }})
              </span>
            </div>
            <div v-if="row.levels && row.levels.length" class="flex items-start gap-1.5 flex-wrap">
              <span class="text-slate-400 font-semibold shrink-0">Education:</span>
              <span class="text-slate-700 font-semibold">
                {{ row.levels.map((l: any) => EDUCATION_LEVELS[l]).join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty Filter State -->
    <div v-else-if="searchQuery.trim()" class="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
      <p class="text-xs text-slate-500 font-medium">No activities match "{{ searchQuery }}".</p>
    </div>

    <div v-else class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
      <p class="text-sm text-slate-500 font-medium">No activities recorded for this entry.</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
