<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import ExportButtons from '@/components/map/ExportButtons.vue'
import MapFilterBar from '@/components/map/MapFilterBar.vue'
import MapTable from '@/components/map/MapTable.vue'
import MapPagination from '@/components/map/MapPagination.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useMapStore } from '@/stores/map'

/**
 * Programme Map page — the main view for admins and coordinators to browse,
 * filter, sort, and export programme entries across all member organisations.
 */
const mapStore = useMapStore()

onMounted(() => mapStore.fetchMapEntries())
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Programme Map" />
    </template>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-[var(--ink-900)] tracking-tight">The Map</h1>
        <p class="text-xs sm:text-sm text-[var(--ink-500)] mt-1">
          Filter member programme entries across any combination of dimensions, then export or view geographically.
        </p>
      </div>
      <ExportButtons />
    </div>

    <MapFilterBar />

    <div class="flex items-center justify-between mb-2.5">
      <span class="text-xs text-[var(--ink-500)]">
        <b class="text-[var(--ink-900)]">{{ mapStore.filtered.length }}</b> entries match your filters, out of {{ mapStore.mapEntries.length }}
      </span>
    </div>

    <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden">
      <div v-if="mapStore.loading" class="p-5 sm:p-6 flex items-center justify-center py-12">
        <svg class="animate-spin h-5 w-5 text-[var(--ink-400)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <div v-else-if="!mapStore.paged.length" class="p-5 sm:p-6">
        <EmptyState
          v-if="mapStore.hasActiveFilters"
          icon="search"
          title="No entries match these filters"
          message="Try widening your date range or clearing a filter."
        >
          <template #action>
            <button class="px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors whitespace-nowrap" @click="mapStore.clearFilters">Clear filters</button>
          </template>
        </EmptyState>
        <EmptyState v-else icon="search" title="No data" message="No programme entries found." />
      </div>

      <MapTable v-else />
      <MapPagination v-if="mapStore.paged.length && mapStore.totalPages > 1" />
    </div>
  </AppShell>
</template>
