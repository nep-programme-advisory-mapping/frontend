<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { downloadOrganisationProgrammesPdf } from '@/api/programmeReport.api'
import { exportSheetsToPdf } from '@/utils/pdfExport'
import { memberApi } from '@/api/member.api'
import { useEntriesStore } from '@/stores/entries.store'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { useToast } from '@/utils/toast'
import { EDUCATION_LEVELS } from '@/utils/format'

const props = defineProps<{
  show: boolean
  organisationId: string | number | null
  organisationName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(false)
const downloading = ref(false)
const entries = ref<any[]>([])
const reportContainerRef = ref<HTMLElement | null>(null)

const entriesStore = useEntriesStore()
const taxonomyStore = useTaxonomyStore()
const toast = useToast()

watch(
  () => [props.show, props.organisationId],
  async () => {
    if (props.show && props.organisationId) {
      loading.value = true
      try {
        if (taxonomyStore.categories.length === 0) {
          await taxonomyStore.fetchTaxonomy()
        }
        const res = await memberApi.listProgrammeEntries(props.organisationId)
        const raw = res.data?.data ?? res.data ?? []
        const rawList = Array.isArray(raw) ? raw : []

        // Fetch full deep details for each programme entry in parallel
        const fullDetails = await Promise.all(
          rawList.map(async (item: any) => {
            try {
              const cleanId = String(item.id).replace('entry-', '')
              return await entriesStore.fetchById(cleanId)
            } catch {
              return item
            }
          })
        )
        entries.value = fullDetails
      } catch (err) {
        entries.value = []
      } finally {
        loading.value = false
      }
    } else {
      entries.value = []
    }
  },
  { immediate: true }
)

async function handleDownloadPdf() {
  if (!props.organisationId) return
  downloading.value = true
  try {
    const orgSlug = (props.organisationName || 'Organisation')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30)

    if (reportContainerRef.value) {
      try {
        await exportSheetsToPdf(reportContainerRef.value, `${orgSlug}_All_Programmes.pdf`)
        toast.success('All programmes PDF report downloaded successfully!')
        return
      } catch (clientErr) {
        console.warn('Client-side PDF generation failed, falling back to backend generator:', clientErr)
      }
    }

    await downloadOrganisationProgrammesPdf(props.organisationId, `${orgSlug}_All_Programmes.pdf`)
    toast.success('All programmes PDF report downloaded successfully!')
  } catch (err: any) {
    if (err?.response?.status === 403) {
      toast.error('Forbidden: You can only generate reports for your organisation.')
    } else {
      toast.error('Failed to generate organisation programmes PDF. Please try again.')
    }
  } finally {
    downloading.value = false
  }
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function computeTotalFte() {
  return entries.value.reduce((sum, e) => sum + (parseFloat(e.staffFte || e.fte_staff || 0) || 0), 0).toFixed(1)
}

function getProvincesList(entry: any) {
  if (entry.locations && entry.locations.length) {
    const formatted = entry.locations.map((loc: any) => {
      const prov = loc.provinceName || loc.province?.province_name || loc.province?.name || loc.name || loc.label || loc.country || ''
      const dist = loc.districtName || loc.district?.name || loc.district?.district_name || (typeof loc.district === 'string' ? loc.district : '')
      if (prov && dist) {
        return `${prov} (${dist})`
      }
      return prov
    }).filter(Boolean)
    const unique = Array.from(new Set(formatted))
    if (unique.length) return unique.join(', ')
  }
  return entry.provincesDisplay || 'Not specified'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        @click.self="emit('close')"
      >
        <div class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">

          <!-- Top Modal Action Bar -->
          <div class="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <BaseIcon name="file" :size="18" class="text-[#0F5A4D]" />
                Organisation Programmes Export Preview
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Preview consolidated multi-programme report for {{ organisationName || 'Organisation' }}
              </p>
            </div>

            <div class="flex items-center gap-2.5">
              <button
                type="button"
                :disabled="downloading || loading || !entries.length"
                @click="handleDownloadPdf"
                class="px-4 py-2 text-xs font-bold bg-[#0F5A4D] hover:bg-[#0c483d] text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg v-if="downloading" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <BaseIcon v-else name="download" :size="14" />
                {{ downloading ? 'Exporting PDF...' : 'Download PDF' }}
              </button>

              <button
                type="button"
                @click="emit('close')"
                class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <BaseIcon name="close" :size="18" />
              </button>
            </div>
          </div>

          <!-- Document Preview Canvas (Simulated Multi-Page A4 PDF Deck) -->
          <div ref="reportContainerRef" class="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-200/70 space-y-8">
            <div v-if="loading" class="bg-white rounded-xl shadow-md border border-slate-200 p-16 flex items-center justify-center max-w-[780px] mx-auto">
              <LoadingSpinner message="Loading full programme details..." />
            </div>

            <div v-else-if="entries.length === 0" class="bg-white rounded-xl shadow-md border border-slate-200 p-12 text-center max-w-[780px] mx-auto text-slate-500">
              <p class="font-medium text-sm">No submitted programme entries found for this organisation.</p>
            </div>

            <template v-else>
              <!-- PAGE 1: Organisation Executive Summary Sheet -->
              <div class="report-page-sheet bg-white rounded-xl shadow-md border border-slate-200 p-8 max-w-[780px] mx-auto text-slate-800 text-xs leading-relaxed space-y-6">
                <!-- Report Header -->
                <div class="border-b-2 border-[#0F5A4D] pb-4 flex items-start justify-between gap-4">
                  <div>
                    <div class="text-lg font-extrabold text-[#0F5A4D] tracking-wide uppercase">NEP CAMBODIA</div>
                    <div class="text-[11px] text-slate-500 font-medium">NGO Education Partnership — Organisation Summary Sheet (Page 1 of {{ entries.length + 1 }})</div>
                    <h1 class="text-xl font-bold text-slate-900 mt-2 leading-snug">
                      {{ organisationName || 'Organisation' }}
                    </h1>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-xs font-bold text-[#0F5A4D]">{{ entries.length }} Total Programmes</div>
                    <div class="text-[10px] text-slate-400 mt-1 font-medium">
                      Report Date: {{ formatDate() }}
                    </div>
                  </div>
                </div>

                <!-- Summary Stats Box -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span class="text-[11px] text-slate-400 font-semibold block uppercase">Total Programmes</span>
                    <span class="text-lg font-bold text-[#0F5A4D]">{{ entries.length }}</span>
                  </div>
                  <div>
                    <span class="text-[11px] text-slate-400 font-semibold block uppercase">Total Staffing (FTE)</span>
                    <span class="text-lg font-bold text-slate-900">{{ computeTotalFte() }} FTE</span>
                  </div>
                  <div>
                    <span class="text-[11px] text-slate-400 font-semibold block uppercase">Scope</span>
                    <span class="text-lg font-bold text-slate-900">National</span>
                  </div>
                </div>

                <!-- Overview Table -->
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                    Programmes Index
                  </h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <thead class="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                        <tr>
                          <th class="p-2 border border-slate-200 w-8 text-center">Page</th>
                          <th class="p-2 border border-slate-200">Programme Name</th>
                          <th class="p-2 border border-slate-200">Period</th>
                          <th class="p-2 border border-slate-200">Locations</th>
                          <th class="p-2 border border-slate-200">Status</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200">
                        <tr v-for="(e, idx) in entries" :key="e.id" class="hover:bg-slate-50">
                          <td class="p-2 border border-slate-200 text-center font-bold text-[#0F5A4D]">p.{{ idx + 2 }}</td>
                          <td class="p-2 border border-slate-200 font-bold text-slate-900">{{ e.name || e.programme_name }}</td>
                          <td class="p-2 border border-slate-200">{{ e.startYear || e.start_year || 'N/A' }} – {{ e.isOngoing || e.ongoing ? 'Ongoing' : (e.endYear || e.end_year || 'N/A') }}</td>
                          <td class="p-2 border border-slate-200 text-slate-700">{{ getProvincesList(e) }}</td>
                          <td class="p-2 border border-slate-200">
                            <BaseBadge :tone="!e.isUnverified && !e.is_unverified ? 'green' : 'amber'" dot>
                              {{ !e.isUnverified && !e.is_unverified ? 'Verified' : 'Unverified' }}
                            </BaseBadge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-slate-200 pt-3 text-center text-xs font-medium text-slate-500">
                  Confidential — NGO Education Partnership (NEP) System • Organisation Executive Summary
                </div>
              </div>

              <!-- PAGES 2..N: Individual Programme Page Sheets (1 Page per Programme) -->
              <div
                v-for="(e, idx) in entries"
                :key="e.id"
                class="report-page-sheet bg-white rounded-xl shadow-md border border-slate-200 p-8 max-w-[780px] mx-auto text-slate-800 text-xs leading-relaxed space-y-6 relative"
              >
                <!-- Sheet Header -->
                <div class="border-b-2 border-[#0F5A4D] pb-4 flex items-start justify-between gap-4">
                  <div>
                    <div class="text-lg font-extrabold text-[#0F5A4D] tracking-wide uppercase">NEP CAMBODIA</div>
                    <div class="text-[11px] text-slate-500 font-medium">
                      Programme Report Sheet (Page {{ idx + 2 }} of {{ entries.length + 1 }})
                    </div>
                    <h2 class="text-xl font-bold text-slate-900 mt-2 leading-snug">
                      {{ e.name || e.programme_name || 'Untitled Programme' }}
                    </h2>
                    <p class="text-xs text-slate-600 font-semibold mt-1">
                      Organisation: <span class="text-slate-900">{{ organisationName || e.organisationName || 'N/A' }}</span>
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <BaseBadge :tone="!e.isUnverified && !e.is_unverified ? 'green' : 'amber'" dot>
                      {{ !e.isUnverified && !e.is_unverified ? 'Verified' : 'Unverified' }}
                    </BaseBadge>
                    <div class="text-[10px] text-slate-400 mt-2 font-medium">
                      Report Date: {{ formatDate() }}
                    </div>
                  </div>
                </div>

                <!-- Section 1: Basic Info & Budget -->
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                    1. Programme Information & Budget
                  </h4>
                  <div class="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 grid grid-cols-2 gap-3">
                    <div>
                      <span class="text-slate-400 font-medium block text-[11px]">Implementation Period</span>
                      <span class="font-semibold text-slate-900">
                        {{ e.startYear || e.start_year || 'N/A' }} – {{ e.isOngoing || e.ongoing ? 'Ongoing' : (e.endYear || e.end_year || 'N/A') }}
                      </span>
                    </div>
                    <div>
                      <span class="text-slate-400 font-medium block text-[11px]">Total Annual Budget</span>
                      <span class="font-semibold text-slate-900">
                        <template v-if="e.annual_budget_usd">${{ Number(e.annual_budget_usd).toLocaleString() }} USD</template>
                        <template v-else-if="e.budgetBand">{{ e.budgetBand }}</template>
                        <template v-else>Not specified</template>
                      </span>
                    </div>
                    <div v-if="e.staffFte || e.fte_staff">
                      <span class="text-slate-400 font-medium block text-[11px]">Staffing (FTE)</span>
                      <span class="font-semibold text-slate-900">{{ e.staffFte || e.fte_staff }} FTE</span>
                    </div>
                    <div v-if="e.directBeneficiaries || e.indirectBeneficiaries">
                      <span class="text-slate-400 font-medium block text-[11px]">Beneficiaries</span>
                      <span class="font-semibold text-slate-900">
                        Direct: {{ e.directBeneficiaries || 0 }} · Indirect: {{ e.indirectBeneficiaries || 0 }}
                      </span>
                    </div>
                    <div class="col-span-2 pt-1">
                      <span class="text-slate-400 font-medium block text-[11px] mb-0.5">Description / Summary</span>
                      <p class="text-slate-700 leading-normal">{{ e.description || e.method || 'No description provided.' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Section 2: Programme Activities -->
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                    2. Programme Activities & Taxonomy
                  </h4>
                  <div v-if="e.activities && e.activities.length" class="overflow-x-auto">
                    <table class="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <thead class="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                        <tr>
                          <th class="p-2 border border-slate-200">Role</th>
                          <th class="p-2 border border-slate-200">Activity Code & Title</th>
                          <th class="p-2 border border-slate-200">Education Levels</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200">
                        <tr v-for="(act, aIdx) in e.activities" :key="aIdx" class="hover:bg-slate-50">
                          <td class="p-2 border border-slate-200 font-bold" :class="act.primary || act.is_primary || act.importance === 'primary' || act.importance === 'core' ? 'text-teal-700' : 'text-slate-600'">
                            {{ act.primary || act.is_primary || act.importance === 'primary' || act.importance === 'core' ? 'Core' : 'Supporting' }}
                          </td>
                          <td class="p-2 border border-slate-200">
                            <div class="font-bold text-slate-900">
                              <span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10.5px] mr-1">{{ act.code || act.activity_code }}</span>
                              {{ taxonomyStore.itemByCode(act.code || act.activity_code)?.label || act.label || act.name || act.code }}
                            </div>
                            <div v-if="act.other_text || act.otherText" class="text-[10px] text-slate-400 italic mt-0.5">Note: {{ act.other_text || act.otherText }}</div>
                          </td>
                          <td class="p-2 border border-slate-200">
                            <template v-if="Array.isArray(act.levels) && act.levels.length">
                              {{ act.levels.map((l: any) => EDUCATION_LEVELS[l] || l).join(', ') }}
                            </template>
                            <template v-else-if="Array.isArray(act.education_levels)">
                              {{ act.education_levels.join(', ') }}
                            </template>
                            <template v-else>
                              {{ act.education_levels || '—' }}
                            </template>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-200">
                    No registered activity taxonomy items.
                  </div>
                </div>

                <!-- Section 3: Geographic Coverage -->
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                    3. Geographic Coverage
                  </h4>
                  <div class="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                    <span class="text-slate-400 font-medium block text-[11px] mb-1">Covered Locations</span>
                    <span class="font-semibold text-slate-900">{{ getProvincesList(e) }}</span>
                  </div>
                </div>

                <!-- Section 4: Government Agreements -->
                <div class="space-y-2">
                  <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                    4. Government Agreements & Counterparts
                  </h4>
                  <div v-if="e.governmentAgreements && e.governmentAgreements.length" class="overflow-x-auto">
                    <table class="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <thead class="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                        <tr>
                          <th class="p-2 border border-slate-200">Agreement Name / Counterpart</th>
                          <th class="p-2 border border-slate-200">Nature / Level</th>
                          <th class="p-2 border border-slate-200">Institution / Entity</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200">
                        <tr v-for="(agr, gIdx) in e.governmentAgreements" :key="gIdx">
                          <td class="p-2 border border-slate-200 font-medium text-slate-900">{{ agr.counterpart || agr.counterpart_agency || agr.name || '—' }}</td>
                          <td class="p-2 border border-slate-200">{{ agr.nature || agr.status || '—' }}</td>
                          <td class="p-2 border border-slate-200">{{ agr.institution || agr.institution_name || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-200">
                    No formal government agreements recorded.
                  </div>
                </div>

                <!-- Section 5: Keywords -->
                <div v-if="e.keywords && e.keywords.length" class="space-y-2">
                  <h4 class="text-xs font-bold text-[#0F5A4D] uppercase tracking-wider border-b border-slate-200 pb-1">
                    5. Keywords & Focus Areas
                  </h4>
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <span
                      v-for="(kw, kIdx) in e.keywords"
                      :key="kIdx"
                      class="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[11px] font-medium"
                    >
                      {{ typeof kw === 'string' ? kw : (kw.keyword || kw.name) }}
                    </span>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-slate-200 pt-3 text-center text-xs font-medium text-slate-500">
                  Confidential — NGO Education Partnership (NEP) System • Self-Service Programme Report Page {{ idx + 2 }}
                </div>
              </div>
            </template>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
