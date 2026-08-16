<!-- Page header for the adviser detail view:
     shows the title, status badge, source metadata, and action buttons -->
<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

defineProps<{
  status: string
  documentName: string
  submittingParty: string
  scopeDisplay: string
  delivering: boolean
  isComplete?: boolean
  incompleteSectionBCount?: number
}>()

function deliverTitle(isComplete: boolean | undefined, incompleteSectionBCount: number | undefined): string {
  if (!isComplete) {
    if (incompleteSectionBCount) {
      return `${incompleteSectionBCount} Section B card${incompleteSectionBCount > 1 ? 's are' : ' is'} missing organisation name or description.`
    }
    return 'Section A (programme profile) is required before delivering.'
  }
  return ''
}

const emit = defineEmits<{
  back: []
  saveDraft: []
  markDelivered: []
  viewDocument: []
}>()
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-5 border-b border-slate-200/80 mb-6 bg-white/50 backdrop-blur-xs">

    <!-- Left: title + metadata -->
    <div>
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Draft advisory note</h1>
        <span
          v-if="status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED"
          class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-2xs"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Advice delivered
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-2xs"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Submitted for review
        </span>
      </div>

      <div class="mt-2.5 text-xs text-slate-500 flex flex-wrap items-center gap-2 font-medium">
        <span>Source: 
          <a
            href="#"
            @click.prevent="emit('viewDocument')"
            class="text-[#0F5A4D] font-bold hover:underline underline-offset-2 inline-flex items-center gap-1 bg-[#0F5A4D]/10 px-2 py-0.5 rounded-md"
            title="Click to view or download submitted document"
          >
            <BaseIcon name="file" size="13" />
            {{ documentName }}
          </a>
        </span>
        <span class="text-slate-300">•</span>
        <span>Submitted by <span class="font-bold text-slate-700">{{ submittingParty }}</span></span>
        <span class="text-slate-300">•</span>
        <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-semibold">Scope: {{ scopeDisplay }}</span>
      </div>
    </div>

    <!-- Right: action buttons -->
    <div class="flex items-center gap-2.5 shrink-0 mt-3 md:mt-0">
      <button
        @click="emit('back')"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0F5A4D] transition shadow-2xs cursor-pointer"
      >
        <BaseIcon name="arrowLeft" size="14" />
        Back to The Adviser
      </button>

      <template v-if="status !== ADVISORY_NOTE_STATUS.ADVICE_DELIVERED">
        <button
          @click="emit('saveDraft')"
          class="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
        >
          Save draft
        </button>

        <button
          @click="emit('markDelivered')"
          :disabled="delivering || !isComplete"
          :title="deliverTitle(isComplete, incompleteSectionBCount)"
          class="px-4 py-2 bg-[#0F5A4D] text-white rounded-lg text-xs font-bold hover:bg-[#0c483d] transition shadow-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <BaseIcon v-if="delivering" name="refresh" size="14" class="animate-spin" />
          {{ delivering ? 'Saving…' : 'Mark advice delivered →' }}
        </button>
      </template>
    </div>

  </div>
</template>
