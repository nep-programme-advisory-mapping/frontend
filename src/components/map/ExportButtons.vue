<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { exportMapEntriesCsv, exportMapEntriesPdf } from '@/api/map.api'
import { useMapStore } from '@/stores/map'
import { extractPrimaryActivityCodes } from '@/utils/activityHelpers'

const mapStore = useMapStore()
const exportingCsv = ref(false)
const exportingPdf = ref(false)

/**
 * Triggers a CSV export of filtered map entries via API (with client fallback).
 */
async function handleExportCsv() {
  exportingCsv.value = true
  try {
    const params = mapStore.toApiFilters()
    await exportMapEntriesCsv(params)
  } catch (error) {
    console.warn('API CSV export failed, falling back to filtered CSV generation:', error)
    exportFilteredToCsv(mapStore.filtered)
  } finally {
    exportingCsv.value = false
  }
}

/**
 * Triggers a PDF report export of filtered map entries via backend API.
 */
async function handleExportPdf() {
  exportingPdf.value = true
  try {
    const params = mapStore.toApiFilters()
    await exportMapEntriesPdf(params)
  } catch (error) {
    console.error('PDF export failed:', error)
  } finally {
    exportingPdf.value = false
  }
}

/**
 * Client-side CSV generator fallback for currently filtered entries.
 */
function exportFilteredToCsv(items: any[]) {
  const headers = ['Programme Name', 'Organisation', 'Status', 'Core Activities', 'Audiences', 'Provinces', 'Budget Band']
  const rows = items.map(e => {
    const name = e.programme_name || e.name || 'Untitled'
    const org = e.organisation_name || e.organisation?.name || '—'
    const status = (e.status === 'verified' || e.is_verified) ? 'Verified' : 'Unverified'
    const activities = (extractPrimaryActivityCodes(e.activities) || []).join('; ')
    const audiences = (e.activities?.map((a: any) => a.inclusion_group).filter(Boolean) || []).join('; ')
    const provinces = (e.provinces || e.locations?.map((l: any) => l.province?.province_name || l.province_name).filter(Boolean) || []).join('; ')
    const budget = e.budget_band || e.budget_band_display || e.budgetBand?.label || '—'

    return [
      `"${name.replace(/"/g, '""')}"`,
      `"${org.replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${activities.replace(/"/g, '""')}"`,
      `"${audiences.replace(/"/g, '""')}"`,
      `"${provinces.replace(/"/g, '""')}"`,
      `"${budget.replace(/"/g, '""')}"`,
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `programme-entries-filtered-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2.5">
    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="exportingCsv"
      class="shrink-0"
      @click="handleExportCsv"
    >
      <BaseIcon name="download" size="16" />
      {{ exportingCsv ? 'Exporting...' : 'Export CSV' }}
    </BaseButton>

    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="exportingPdf"
      class="shrink-0"
      @click="handleExportPdf"
    >
      <BaseIcon name="file" size="16" />
      {{ exportingPdf ? 'Exporting...' : 'PDF report' }}
    </BaseButton>
  </div>
</template>
