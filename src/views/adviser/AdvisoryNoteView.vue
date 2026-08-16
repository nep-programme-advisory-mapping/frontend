<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { adviserApi } from '@/api/adviser.api'
import { unwrapData } from '@/utils/apiHelpers'
import { useAuthStore } from '@/stores/auth'
import type { Submission } from '@/types/adviser'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const props = defineProps<{ entryId: string }>()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const note = ref<Submission | null>(null)
const notFound = ref(false)

const isMember = computed(() => auth.userRole === 'member_org')

onMounted(async () => {
  const stateNote = (history.state as any)?.note
  if (stateNote?.id) {
    note.value = stateNote
    loading.value = false
    return
  }
  try {
    const res = await adviserApi.getByProgrammeEntry(Number(props.entryId))
note.value = unwrapData(res.data)
  } catch (err: any) {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

const scopeDisplay = computed(() => {
  if (!note.value) return ''
  return note.value.analysis_scope_detail
    ? `${note.value.analysis_scope}: ${note.value.analysis_scope_detail}`
    : note.value.analysis_scope ?? 'full map'
})

const recommendations = computed(() => (note.value as any)?.recommendations ?? [])

const workflowSteps = computed(() => {
  const status = note.value?.status ?? ''
  return [
    { label: 'Document uploaded', done: true, time: note.value?.submitted_at },
    { label: 'AI draft generated', done: true, time: note.value?.submitted_at },
    { label: 'Advice delivered', done: status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED, time: note.value?.delivered_at },
  ]
})

function formatTime(dt: string | null | undefined) {
  if (!dt) return ''
  const diff = Math.round((Date.now() - new Date(dt).getTime()) / 60000)
  if (diff < 60) return `${diff} minute${diff !== 1 ? 's' : ''} ago`
  const h = Math.round(diff / 60)
  if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['Programme entries', 'Advisory note']" />
    </template>

    <div v-if="loading" class="flex justify-center py-20">
      <LoadingSpinner message="Loading advisory note…" />
    </div>

    <div v-else-if="notFound || !note" class="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
      <p class="text-slate-500 text-sm">
        <template v-if="isMember">No coordination advice has been issued for this programme entry yet. The NEP coordinator will notify you when the analysis is complete.</template>
        <template v-else>No advisory note found for this programme entry.</template>
      </p>
      <button @click="router.back()" class="mt-4 text-[13px] font-semibold text-[#0F5A4D] hover:underline">← Go back</button>
    </div>

    <div v-else class="max-w-[1100px] mx-auto pb-12">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 py-5 border-b border-slate-200 mb-6">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-bold text-slate-900">Draft advisory note</h1>
            <span
              v-if="note.status === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED"
              class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Advice delivered
            </span>
            <span v-else class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              In review
            </span>
          </div>
          <p class="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
            <span>Source: <span class="font-semibold text-slate-700">{{ note.document_name }}</span></span>
            <span class="text-slate-300">·</span>
            <span>Submitted by <span class="font-semibold text-slate-700">{{ note.submitting_party }}</span></span>
            <span class="text-slate-300">·</span>
            <span>Analysed against <span class="font-semibold text-slate-700">{{ scopeDisplay }}</span></span>
          </p>
        </div>
        <button
          @click="router.back()"
          class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back
        </button>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        <!-- LEFT: Sections A–D -->
        <div class="space-y-5">

          <!-- Section A -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 class="text-[14px] font-bold text-gray-900">A · Programme profile as interpreted</h2>
              <span class="px-2.5 py-1 text-[11px] font-bold bg-indigo-100 text-indigo-700 rounded-full">AI Generated & Manual Entry</span>
            </div>
            <div class="px-6 py-5">
              <p v-if="note.section_profile" class="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{{ note.section_profile }}</p>
              <p v-else class="text-[13px] text-slate-400 italic">No profile recorded.</p>
            </div>
          </div>

          <!-- Section B -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <h2 class="text-[14px] font-bold text-gray-900">B · Coordination recommendations</h2>
              <span v-if="recommendations.length" class="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {{ recommendations.length }}
              </span>
            </div>
            <div class="p-6 space-y-4">
              <div v-if="recommendations.length === 0" class="py-6 text-center text-[13px] text-slate-400 italic">
                No coordination recommendations recorded.
              </div>
              <div
                v-for="rec in recommendations"
                :key="rec.id"
                class="border border-slate-200 rounded-xl p-5 bg-white"
              >
                <div class="flex flex-wrap items-center gap-3 mb-2">
                  <span class="font-bold text-[14px] text-slate-900">{{ rec.organisation_name || '—' }}</span>
                  <span class="px-2.5 py-1 text-[11px] font-bold rounded-full bg-teal-100 text-teal-800">{{ rec.type }}</span>
                </div>
                <p v-if="rec.programme_entry_id" class="text-xs text-indigo-600 font-medium mb-2">
                  Linked entry: Entry #{{ rec.programme_entry_id }}
                </p>
                <p class="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{{ rec.relational }}</p>
              </div>
            </div>
          </div>

          <!-- Section C -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 class="text-[14px] font-bold text-gray-900">C · Gaps in the map</h2>
            </div>
            <div class="px-6 py-5">
              <p v-if="note.section_gaps" class="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{{ note.section_gaps }}</p>
              <p v-else class="text-[13px] text-slate-400 italic">No gaps recorded.</p>
            </div>
          </div>

          <!-- Section D: only shown to staff, hidden from member_org -->
          <div v-if="!isMember" class="bg-rose-50/30 border border-rose-200/60 rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-rose-200/60 bg-rose-50/50 flex items-center justify-between">
              <h2 class="text-[14px] font-bold text-rose-900">D · Notes for the coordinator</h2>
              <span class="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full">Internal — not released</span>
            </div>
            <div class="px-6 py-5">
              <p v-if="note.section_coordinators_notes" class="text-[13.5px] text-rose-900 leading-relaxed whitespace-pre-wrap">{{ note.section_coordinators_notes }}</p>
              <p v-else class="text-[13px] text-rose-300 italic">No coordinator notes recorded.</p>
            </div>
          </div>

        </div>

        <!-- RIGHT: Workflow + Reasoning -->
        <div class="space-y-5">

          <!-- Workflow -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 class="text-[14px] font-bold text-gray-900 mb-5">Workflow</h2>
            <div class="relative pl-8 space-y-6 border-l-2 border-gray-100 ml-3">
              <div v-for="step in workflowSteps" :key="step.label" class="relative">
                <div
                  class="absolute -left-[41px] top-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                  :class="step.done ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-gray-100 text-gray-400'"
                >
                  <svg v-if="step.done" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                  <div v-else class="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
                <p class="text-[13px] font-bold text-gray-900 leading-none">{{ step.label }}</p>
                <p v-if="step.time" class="text-[12px] text-gray-500 mt-0.5">{{ formatTime(step.time) }}</p>
              </div>
            </div>

            <template v-if="note.final_note_file_url">
              <hr class="border-gray-100 my-5" />
              <a
                href="#"
                @click.prevent="adviserApi.openFinalNoteFile(note!.id)"
                class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0F5A4D] hover:underline"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
                Final note: {{ note.final_note_file_url.split('/').pop() }}
              </a>
            </template>
          </div>

          <!-- Reasoning -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 class="text-[14px] font-bold text-gray-900 mb-2">Reasoning for AI recommendations</h2>
            <p class="text-[12.5px] text-gray-500 leading-relaxed">
              Recommendations are grounded only in structured map data — activity tags, geography, and audience selections submitted by members. The system does not assess methodology, quality, or financial viability.
            </p>
          </div>

        </div>
      </div>
    </div>
  </AppShell>
</template>
