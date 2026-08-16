<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import ToastStack from '@/components/common/ToastStack.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import DetailPageHeader from '@/components/adviser/DetailPageHeader.vue'
import DocumentViewerPanel from '@/components/adviser/DocumentViewerPanel.vue'
import WorkflowCard from '@/components/adviser/WorkflowCard.vue'
import SectionEditor from '@/components/adviser/SectionEditor.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import RecommendationsList from '@/components/adviser/RecommendationsList.vue'
import GapsList from '@/components/adviser/GapsList.vue'
import { useAdviserDetailController } from '@/composables/useAdviserDetailController'

const {
  assigneeId, coordinators, currentStatus, delivering, exportingPdf,
  fetchingOverlaps, form, generatingAiDraft, isDelivered, isDraftEntry, incompleteSectionBCount, isProfileEmpty, isSectionsComplete,
  loading, overlapNoResults, scopeDisplay, submission, submissionId, toasts,
  showDraftModal, draftGenerating, draftOrganisations, selectedOrgId, programmeName, startYear,
  addGap, addRecommendation, assignCoordinator, exportAdvisoryNotePdf,
  fetchMapOverlaps, generateAiAdvisoryDraft, generateAndDraft, goBack,
  handleViewDocument, markDelivered, openDraftModal, openFinalNoteFile,
  removeGap, removeRecommendation, saveDraft,
} = useAdviserDetailController()
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['The Adviser', 'Draft advisory note']" />
    </template>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex items-center justify-center max-w-[1400px] mx-auto my-6">
      <LoadingSpinner message="Loading draft advisory note..." />
    </div>

    <div v-else class="max-w-[1400px] mx-auto pb-12">

      <!-- Header bar -->
      <DetailPageHeader
        :status="currentStatus"
        :document-name="submission?.document_name ?? '—'"
        :submitting-party="submission?.submitting_party ?? '—'"
        :scope-display="scopeDisplay"
        :delivering="delivering"
        :is-complete="isSectionsComplete"
        :incomplete-section-b-count="incompleteSectionBCount"
        @back="goBack"
        @save-draft="saveDraft"
        @mark-delivered="markDelivered"
        @view-document="handleViewDocument"
      />

      <!-- Draft entry warning banner -->
      <div
        v-if="isDraftEntry"
        class="mb-6 flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200"
      >
        <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <p class="text-[13px] font-semibold text-amber-800">Programme not yet submitted by member organisation</p>
          <p class="text-[12px] text-amber-700 mt-0.5">This programme entry is still a draft. Advisory notes can be prepared, but advice cannot be marked as delivered until the member org submits the programme.</p>
        </div>
      </div>

      <!-- Dual-pane workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        <!-- LEFT PANE: Document viewer + Workflow sidebar -->
        <div class="space-y-6">
          <DocumentViewerPanel
            :document-name="submission?.document_name"
            :submitting-party="submission?.submitting_party"
            :analysis-scope="submission?.analysis_scope"
            :analysis-scope-detail="submission?.analysis_scope_detail ?? undefined"
            :exporting-pdf="exportingPdf"
            @export-pdf="exportAdvisoryNotePdf"
          />
          <WorkflowCard
            :current-status="currentStatus"
            :assignee-id="assigneeId"
            :coordinators="coordinators"
            :delivered-at="submission?.delivered_at ?? null"
            :final-note-file-url="(submission as any)?.final_note_file_url ?? null"
            @update:assigneeId="assignCoordinator"
            @open-file="openFinalNoteFile"
          />
        </div>

        <!-- RIGHT PANE: Advisory note sections A–D -->
        <div class="space-y-6">

          <div class="rounded-xl shadow-sm overflow-hidden flex flex-col bg-white border border-gray-200">
            <div class="px-6 py-4 border-b border-b-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 class="text-[14px] font-bold text-gray-900">A · Programme profile as interpreted</h2>
              <div class="flex items-center gap-2">
                <BaseBadge :tone="generatingAiDraft ? 'amber' : (form.sectionA ? 'teal' : 'gray')" dot>
                  {{ generatingAiDraft ? 'ANALYSING…' : (form.sectionA ? 'AI + MANUAL' : 'AI ANALYSIS') }}
                </BaseBadge>
                <button
                  v-if="!isDelivered && !isDraftEntry"
                  @click="generateAiAdvisoryDraft"
                  :disabled="generatingAiDraft || fetchingOverlaps"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition disabled:opacity-60"
                  :class="(generatingAiDraft || fetchingOverlaps) ? 'bg-[#0F5A4D]/60 text-white cursor-not-allowed' : 'bg-[#0F5A4D] hover:bg-[#0c483d] text-white shadow-sm'"
                >
                  <svg v-if="generatingAiDraft || fetchingOverlaps" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                  {{ (generatingAiDraft || fetchingOverlaps) ? 'Analysing…' : 'AI Analysis' }}
                </button>
              </div>
            </div>
            <div class="p-6 transition-all rounded-b-xl focus-within:ring-2 focus-within:ring-[#0F5A4D]/20">
              <textarea
                :value="form.sectionA"
                @input="form.sectionA = ($event.target as HTMLTextAreaElement).value"
                placeholder="Type or paste the interpreted programme profile here..."
                :readonly="isDelivered || isDraftEntry || generatingAiDraft"
                class="w-full text-sm leading-relaxed resize-y min-h-[220px] border-none focus:ring-0 p-0 outline-none font-medium text-slate-800"
                :class="isDelivered || isDraftEntry || generatingAiDraft ? 'cursor-default select-text' : ''"
              ></textarea>
            </div>
          </div>

          <RecommendationsList
            :items="form.sectionB"
            :fetching="fetchingOverlaps || generatingAiDraft"
            :no-results="overlapNoResults"
            :profile-empty="isProfileEmpty"
            :readonly="isDelivered || isDraftEntry || generatingAiDraft"
            @add="addRecommendation"
            @remove="removeRecommendation"
            @find-overlaps="fetchMapOverlaps"
            @update:org="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].org = val }"
            @update:type="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].type = val }"
            @update:text="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].text = val }"
          />

          <GapsList
            :items="form.sectionC"
            :readonly="isDelivered || isDraftEntry || generatingAiDraft"
            @add="addGap"
            @remove="removeGap"
            @update:text="(idx, val) => { if (form.sectionC[idx]) form.sectionC[idx].text = val }"
          />

          <!-- D: Coordinator notes -->
          <div class="rounded-xl shadow-sm overflow-hidden flex flex-col bg-rose-50/30 border border-rose-200/60">
            <div class="px-6 py-4 border-b border-rose-200/60 bg-rose-50/50 flex items-center justify-between">
              <h2 class="text-[14px] font-bold text-rose-900">D · Notes for the coordinator</h2>
              <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Internal — not released
                </span>
              </div>
            </div>

            <!-- Generating skeleton — shown across all 4 sections while AI runs -->
            <div v-if="generatingAiDraft" class="p-6 space-y-3">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-4 h-4 rounded-full bg-[#0F5A4D]/40 animate-pulse"></div>
                <span class="text-[12px] text-[#0F5A4D] font-medium animate-pulse">AI is analysing the programme and populating all four sections…</span>
              </div>
              <div class="h-3 bg-rose-200/60 rounded animate-pulse w-full"></div>
              <div class="h-3 bg-rose-200/60 rounded animate-pulse w-5/6"></div>
              <div class="h-3 bg-rose-200/60 rounded animate-pulse w-4/6"></div>
              <div class="h-3 bg-rose-200/60 rounded animate-pulse w-full mt-2"></div>
              <div class="h-3 bg-rose-200/60 rounded animate-pulse w-3/4"></div>
            </div>

            <!-- Editable textarea -->
            <div v-else class="p-6 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all rounded-b-xl">
              <textarea
                :value="form.sectionD"
                @input="form.sectionD = ($event.target as HTMLTextAreaElement).value"
                :placeholder="isDelivered || isDraftEntry ? '' : 'Internal notes for the coordinator. Not included in the version released to the requesting party…'"
                :readonly="isDelivered || isDraftEntry"
                class="w-full text-sm leading-relaxed resize-y min-h-[160px] border-none focus:ring-0 p-0 outline-none font-medium text-rose-900 bg-transparent placeholder-rose-300"
                :class="isDelivered || isDraftEntry ? 'cursor-default select-text' : ''"
              ></textarea>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <ToastStack :toasts="toasts" />

    <!-- AI Draft Programme Modal -->
    <Teleport to="body">
      <div v-if="showDraftModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-[16px] font-bold text-gray-900">AI Draft Programme</h2>
            <button @click="showDraftModal = false" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-[13px] text-gray-500 leading-relaxed">
            The AI will analyse this submission and create a programme entry draft pre-filled across all 5 sections. You can review and edit before submitting.
          </p>

          <!-- Organisation -->
          <div>
            <label class="block text-[12px] font-semibold text-gray-700 mb-1">Member organisation <span class="text-red-500">*</span></label>
            <select
              v-model="selectedOrgId"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option :value="null" disabled>Select organisation…</option>
              <option v-for="org in draftOrganisations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>

          <!-- Programme name -->
          <div>
            <label class="block text-[12px] font-semibold text-gray-700 mb-1">Programme name <span class="text-red-500">*</span></label>
            <input
              v-model="programmeName"
              type="text"
              placeholder="e.g. Education Support Initiative 2026"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Start year -->
          <div>
            <label class="block text-[12px] font-semibold text-gray-700 mb-1">Start year <span class="text-red-500">*</span></label>
            <input
              v-model.number="startYear"
              type="number"
              min="2000"
              max="2100"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="flex gap-3 pt-1">
            <button
              @click="showDraftModal = false"
              class="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              @click="generateAndDraft"
              :disabled="draftGenerating"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg v-if="draftGenerating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ draftGenerating ? 'Generating…' : 'Generate & open draft' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </AppShell>
</template>
