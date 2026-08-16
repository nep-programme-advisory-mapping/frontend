<script setup lang="ts">
import { computed } from 'vue'
import { useProgrammeActivitiesStore } from '@/stores/programmeActivities'
import EducationLevelSelector from './EducationLevelSelector.vue'
import InclusionForm from './InclusionForm.vue'

const props = defineProps<{
  item: {
    code: string
    label: string
  }
}>()

const store = useProgrammeActivitiesStore()

const isChecked = computed(() => store.selected.includes(props.item.code))
const isPrimary = computed(() => store.primary.includes(props.item.code))
const isCollapsed = computed(() => store.collapsedItems.includes(props.item.code))
const isOtherItem = computed(() => {
  const lbl = props.item.label.toLowerCase()
  return (props.item as any).is_other || lbl.includes('other') || lbl.includes('specify')
})

function handleCardClick() {
  store.toggleItem(props.item.code)
}

function handleImportance(importance: 'core' | 'supporting' | 'primary' | 'secondary') {
  store.setActivityImportance(props.item.code, importance)
}

function handleToggleCollapse() {
  store.toggleItemCollapse(props.item.code)
}
</script>

<template>
  <div
    class="bg-white rounded-xl border p-4 transition-colors duration-200 cursor-pointer select-none"
    :class="isChecked ? 'border-teal-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'"
    @click="handleCardClick"
  >
    <!-- Checkbox / Title Row -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 cursor-pointer flex-grow group">
        <!-- Hidden real checkbox for accessibility -->
        <input
          :id="`item-${item.code}`"
          type="checkbox"
          :checked="isChecked"
          class="sr-only"
          tabindex="-1"
          readonly
        />
        <!-- Custom Checkbox -->
        <div
          class="h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
          :class="isChecked
            ? 'border-teal-700 bg-teal-700 text-white shadow-sm ring-2 ring-teal-50'
            : 'border-slate-300 bg-white group-hover:border-slate-400'"
        >
          <svg v-if="isChecked" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <!-- Label -->
        <span 
          class="text-[13px] font-medium text-slate-700 transition-colors"
          :class="isChecked ? 'text-slate-900 font-semibold' : 'group-hover:text-slate-900'"
        >
          {{ item.code }} · {{ item.label }}
        </span>
      </div>
      
      <!-- Core/Supporting toggle + collapse arrow — only visible when checked -->
      <div v-if="isChecked" class="flex items-center gap-1.5 animate-fade-in shrink-0 select-none">
        <!-- Required red asterisk indicator when unselected -->
        <span
          v-if="!store.activityRoles[item.code]"
          class="text-rose-500 font-bold text-sm leading-none shrink-0"
          title="Required: Select Core or Supporting"
        >*</span>

        <!-- Minimalist Core/Supporting toggle -->
        <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/90" @click.stop>
          <button
            type="button"
            @click.stop.prevent="handleImportance('core')"
            class="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
            :class="store.activityRoles[item.code] === 'core'
              ? 'bg-[#0F5A4D] text-white font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 bg-transparent'"
          >
            Core
          </button>
          <button
            type="button"
            @click.stop.prevent="handleImportance('supporting')"
            class="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
            :class="store.activityRoles[item.code] === 'supporting'
              ? 'bg-[#0F5A4D] text-white font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 bg-transparent'"
          >
            Supporting
          </button>
        </div>

        <!-- Collapse / Expand Arrow Only -->
        <button
          type="button"
          @click.stop.prevent="handleToggleCollapse"
          class="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 shrink-0"
          title="Toggle Details"
        >
          <svg
            class="w-4 h-4 transform transition-transform duration-200 pointer-events-none"
            :class="isCollapsed ? '' : 'rotate-180'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Inclusion & Education Levels Sub-form (Only visible if the item is selected and not collapsed) -->
    <div 
      v-if="isChecked && !isCollapsed" 
      class="mt-4 p-5 rounded-xl border border-slate-200 bg-white space-y-5 animate-fade-in cursor-default"
      @click.stop
    >
      <!-- Other (please specify) Text Field -->
      <div v-if="isOtherItem" class="border-b border-slate-100 pb-4" @click.stop>
        <label class="text-xs font-bold text-slate-800 block mb-1.5 pointer-events-none select-none">
          Please specify details <span class="text-rose-500">*</span>
        </label>
        <input
          type="text"
          :value="store.otherText[item.code] || ''"
          @input="(e) => store.setOtherText(item.code, (e.target as HTMLInputElement).value)"
          @click.stop
          @keydown.stop
          placeholder="Type specific activity details here…"
          class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 placeholder:text-slate-400 select-text cursor-text"
        />
      </div>

      <!-- Education Levels -->
      <div>
        <span class="text-xs font-bold text-slate-800 block mb-2">Education Levels</span>
        <EducationLevelSelector
          :model-value="store.educationLevels[item.code] || []"
          @update:model-value="(val) => store.setEducationLevels(item.code, val)"
        />
      </div>

      <!-- Inclusion Focus -->
      <InclusionForm :item-code="item.code" />
    </div>
  </div>
</template>
