<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  items: { type: Array as () => { label: string, value: number }[], required: true },
  actionText: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['action'])

const maxValue = computed(() => {
  if (!props.items.length) return 0
  return Math.max(...props.items.map(item => item.value))
})

function barWidth(value: number) {
  if (!maxValue.value) return '0%'
  return `${(value / maxValue.value) * 100}%`
}

// Top 3 get accent styling
function isTop(index: number) { return index < 3 }
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col h-full">

    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-[14px] font-bold text-gray-900 tracking-tight">{{ title }}</h2>
      <span v-if="subtitle" class="text-[11.5px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{{ subtitle }}</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex flex-col gap-3 flex-1">
      <div v-for="i in 7" :key="i" class="flex items-center gap-3">
        <div class="h-5 w-5 rounded-md bg-gray-100 animate-pulse shrink-0"></div>
        <div class="h-3 rounded-full bg-gray-100 animate-pulse" style="width: 45%"></div>
        <div class="flex-1 h-1.5 rounded-full bg-gray-100 animate-pulse"></div>
        <div class="h-3 w-6 rounded bg-gray-100 animate-pulse shrink-0"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!items.length" class="flex-1 flex flex-col items-center justify-center gap-2 py-8">
      <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">—</div>
      <span class="text-[12.5px] text-gray-400">No data available</span>
    </div>

    <!-- Items list -->
    <div v-else class="flex flex-col gap-2.5 flex-1">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="group flex items-center gap-3 py-1.5 rounded-lg transition-colors"
        :class="isTop(index) ? 'hover:bg-teal-50/50' : 'hover:bg-gray-50'"
      >
        <!-- Rank badge -->
        <div
          class="shrink-0 w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] font-bold"
          :class="index === 0
            ? 'bg-[#0a3d39] text-white'
            : index === 1
            ? 'bg-[#146b63] text-white'
            : index === 2
            ? 'bg-[#1c8479] text-white'
            : 'bg-gray-100 text-gray-500'"
        >
          {{ index + 1 }}
        </div>

        <!-- Label -->
        <span
          class="text-[12.5px] min-w-0 truncate flex-none"
          style="width: 42%"
          :class="isTop(index) ? 'text-gray-800 font-medium' : 'text-gray-500'"
        >{{ item.label }}</span>

        <!-- Progress bar -->
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="item.value === 0 ? 'bg-gray-200' : ''"
            :style="{
              width: barWidth(item.value),
              background: item.value === 0 ? '' : index === 0 ? '#0a3d39' : index === 1 ? '#146b63' : index === 2 ? '#1c8479' : '#4da69c'
            }"
          ></div>
        </div>

        <!-- Count badge -->
        <span
          class="shrink-0 text-[12px] font-bold min-w-[28px] text-right"
          :class="item.value === 0 ? 'text-gray-300' : isTop(index) ? 'text-gray-900' : 'text-gray-600'"
        >{{ item.value }}</span>
      </div>
    </div>

    <!-- Action link -->
    <div v-if="actionText" class="mt-5 pt-4 border-t border-gray-100">
      <button
        @click="emit('action')"
        class="group flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-500 hover:text-[#146b63] transition-colors"
      >
        <span>{{ actionText }}</span>
        <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  </div>
</template>
