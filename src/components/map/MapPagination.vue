<script setup lang="ts">
import { useMapStore } from '@/stores/map'

/**
 * Renders Previous / Next pagination controls for the map entry table.
 *
 * Fully responsive: stacks pagination text and control buttons cleanly on mobile screens.
 */
const mapStore = useMapStore()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--line)] bg-white">
    <span class="text-xs text-[var(--ink-400)]">Page {{ mapStore.page }} of {{ mapStore.totalPages }}</span>
    <div class="flex gap-0.5 w-full sm:w-auto justify-end">
      <button
        :disabled="mapStore.page <= 1"
        class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:not-disabled:border-[var(--teal-600)] hover:not-disabled:text-[var(--teal-700)] hover:not-disabled:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
        @click="mapStore.goToPage(mapStore.page - 1)"
      >‹ Prev</button>
      <button
        :disabled="mapStore.page >= mapStore.totalPages"
        class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:not-disabled:border-[var(--teal-600)] hover:not-disabled:text-[var(--teal-700)] hover:not-disabled:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
        @click="mapStore.goToPage(mapStore.page + 1)"
      >Next ›</button>
    </div>
  </div>
</template>
