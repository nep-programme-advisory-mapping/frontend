<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps<{
  documentName?: string
  submittingParty?: string
  analysisScope?: string
  analysisScopeDetail?: string
  exportingPdf?: boolean
}>()

const emit = defineEmits<{
  exportPdf: []
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Submitted Document File Card -->
    <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 relative overflow-hidden">
      <div class="flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F5A4D] border border-emerald-200/60 flex items-center justify-center shrink-0">
          <BaseIcon name="fileText" size="20" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted File</span>
          <h3 class="text-xs font-bold text-slate-900 truncate mt-0.5" :title="documentName">
            {{ documentName || 'Uploaded File' }}
          </h3>
          <p class="text-[11.5px] text-slate-500 font-medium mt-0.5">
            By <span class="font-bold text-slate-700">{{ submittingParty || 'Member Organisation' }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Export Advisory Note Action Card -->
    <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-[#0F5A4D]/10 text-[#0F5A4D] flex items-center justify-center shrink-0">
            <BaseIcon name="download" size="13" />
          </div>
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Export Advisory Note</h3>
        </div>
        <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-md">Report Export</span>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Region / Scope</span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200/60 rounded-lg font-bold capitalize">
            <BaseIcon name="mapPin" size="12" />
            {{ analysisScopeDetail || analysisScope || 'Full System Map' }}
          </span>
        </div>

        <div>
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Submitting Organisation</span>
          <span class="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold block truncate">
            {{ submittingParty || 'Member Organisation' }}
          </span>
        </div>
      </div>

      <!-- Export Buttons -->
      <div class="pt-2 border-t border-slate-100 space-y-2">
        <button
          @click="emit('exportPdf')"
          :disabled="exportingPdf"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F5A4D] hover:bg-[#0c483d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          <BaseIcon name="download" size="14" />
          {{ exportingPdf ? 'Generating…' : 'Export Report (PDF)' }}
        </button>
      </div>
    </div>

    <!-- AI Methodology Card -->
    <div class="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-1.5">
      <div class="flex items-center gap-2">
        <BaseIcon name="sparkles" size="14" class="text-[#0F5A4D]" />
        <h4 class="text-xs font-bold text-slate-900">AI Matching Methodology</h4>
      </div>
      <p class="text-[11.5px] text-slate-500 leading-relaxed font-medium">
        Recommendations are grounded strictly in structured map data — activity taxonomy tags, geographic locations, and inclusion groups.
      </p>
    </div>
  </div>
</template>