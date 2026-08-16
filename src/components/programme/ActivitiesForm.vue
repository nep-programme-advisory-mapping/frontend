<script setup lang="ts">
import { onMounted } from 'vue'
import ActivityItemCard from './ActivityItemCard.vue'
import { useProgrammeActivitiesStore } from '@/stores/programmeActivities'
import { useCategoriesStore } from '@/stores/categories'

const props = defineProps<{
  modelValue?: { selected: string[]; primary: string[]; aiText: string; inclusions?: any; educationLevels?: any }
}>()

const store = useProgrammeActivitiesStore()
const accordion = useCategoriesStore()

onMounted(async () => {
  await accordion.loadCategories()
  if (props.modelValue && store.selected.length === 0) {
    store.initFromPayload(props.modelValue)
  }
})

function validate() {
  return store.validate()
}

function getData() {
  return store.getData()
}

defineExpose({ validate, getData })
</script>

<template>
  <div class="space-y-4" @click="store.clearError">

    <!-- Validation error banner -->
    <div
      v-if="store.showError"
      class="flex items-center justify-between gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 cursor-pointer shadow-sm animate-fade-in"
      @click.stop="store.clearError"
    >
      <div class="flex items-center gap-2.5">
        <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ store.errorMessage || 'Please select at least one activity before continuing.' }}</span>
      </div>
      <button type="button" class="text-red-500 hover:text-red-800 transition-colors p-1" @click.stop="store.clearError">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Instruction -->
    <p class="text-sm text-gray-500 px-1 hidden sm:block">
      Select every activity item this programme delivers.
      Mark your most important activities as <strong class="text-gray-700">primary</strong> — NEP's coordination matching prioritises these.
    </p>
    <p class="text-xs text-gray-400 px-1 sm:hidden">
      Select activities. Mark key ones as <strong class="text-gray-600">primary</strong> for coordination matching.
    </p>

    <!-- Loading Spinner -->
    <div v-if="accordion.isLoading" class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
      <svg class="animate-spin h-8 w-8 text-teal-800 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span class="text-sm font-medium text-gray-500">Loading activity taxonomy...</span>
    </div>

    <!-- B1–B9 Accordions -->
    <div v-else class="space-y-3">
      <div
        v-for="cat in accordion.categories"
        :key="cat.code"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <!-- Accordion Category Header -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors bg-slate-50/50 cursor-pointer select-none"
          @click="accordion.toggleCategory(cat.code)"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-800">{{ cat.code }} · {{ cat.label }}</span>
            <span
              v-if="accordion.categoryCount(cat.code) > 0"
              class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold bg-teal-800 text-white shadow-sm"
            >
              {{ accordion.categoryCount(cat.code) }}
            </span>
          </div>
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            :class="accordion.openCategories.has(cat.code) ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Category Body -->
        <div v-if="accordion.openCategories.has(cat.code)" class="border-t border-gray-100 px-5 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
          <div
            v-for="sub in cat.subcategories"
            :key="sub.code"
            class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 transition-colors bg-slate-50/30 cursor-pointer select-none"
              @click="accordion.toggleSubcategory(sub.code)"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-slate-700">{{ sub.code }} · {{ sub.label }}</span>
                <span
                  v-if="accordion.subcategoryCount(sub.code) > 0"
                  class="inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full text-[9px] font-bold bg-teal-600 text-white shadow-sm"
                >
                  {{ accordion.subcategoryCount(sub.code) }}
                </span>
              </div>
              <svg
                class="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200"
                :class="accordion.openSubcategories.has(sub.code) ? 'rotate-180' : ''"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="accordion.openSubcategories.has(sub.code)" class="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
              <ActivityItemCard
                v-for="item in sub.items.filter((i: any) => i.is_active !== false)"
                :key="item.code"
                :item="item"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
