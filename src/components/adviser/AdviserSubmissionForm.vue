
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdviserStore } from '@/stores/adviser'
import { memberApi } from '@/api/member.api'
import { unwrapData } from '@/utils/apiHelpers'
import { getMapEntries } from '@/api/map.api'
import { taxonomyApi } from '@/api/taxonomy.api'
import { adviserApi } from '@/api/adviser.api'
import FormFileUpload from '@/components/adviser/FormFileUpload.vue'
import FormScopeSelect from '@/components/adviser/FormScopeSelect.vue'
import FormCoordinatorSelect from '@/components/adviser/FormCoordinatorSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Province } from '@/types/programmeGeographic'
import type { Category } from '@/types/taxonomy'

interface ProgrammeEntryOption {
  id: number
  name: string
  organisation_name?: string
}

const router = useRouter()
const route = useRoute()
const adviserStore = useAdviserStore()

// ── Mode: 'entity' = select from programme entries (default), 'adviser' = external file upload ───
const mode = computed(() => (route.query.mode === 'adviser' ? 'adviser' : 'entity'))

// ── Form state ────────────────────────────────────────────────────────────────
const submittingParty = ref('')
const selectedEntryId = ref('')
const selectedFile = ref<File | null>(null)
const analysisScope = ref<'full_map' | 'geographic' | 'thematic'>('full_map')
const selectedProvince = ref('')
const selectedCategory = ref('')
const assignedTo = ref('unassigned')

// ── Modal & Combobox state ───────────────────────────────────────────────────
const isDropdownOpen = ref(false)
const entrySearchInput = ref('')

// ── Validation ────────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)

// ── Programme entries list (for entity mode) ──────────────────────────────────
const programmeEntries = ref<ProgrammeEntryOption[]>([])
const loadingEntries = ref(false)
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(entrySearchInput, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 250)
})

const filteredEntries = computed(() => {
  const q = debouncedQuery.value.toLowerCase().trim()
  if (!q) return programmeEntries.value
  return programmeEntries.value.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      (e.organisation_name && e.organisation_name.toLowerCase().includes(q)),
  )
})

const selectedEntryObj = computed(() =>
  selectedEntryId.value
    ? programmeEntries.value.find(e => e.id === Number(selectedEntryId.value)) ?? null
    : null
)

function selectEntry(entry: ProgrammeEntryOption) {
  selectedEntryId.value = String(entry.id)
  submittingParty.value = entry.organisation_name || entry.name
  isDropdownOpen.value = false
  entrySearchInput.value = ''
  errors.value.selectedEntry = ''
}

function clearSelectedEntry() {
  selectedEntryId.value = ''
  entrySearchInput.value = ''
  isDropdownOpen.value = true
}

async function loadProgrammeEntries() {
  loadingEntries.value = true
  try {
    const res = await getMapEntries()
    const resData = res.data
    const rawList = resData?.data?.data ?? resData?.data ?? resData ?? []
    const entries = Array.isArray(rawList) ? rawList : []
    programmeEntries.value = entries.map((entry: any) => ({
      id: entry.id,
      name: entry.programme_name || entry.name || `Entry #${entry.id}`,
      organisation_name: entry.organisation_name || entry.organisation?.name || '',
    }))
  } catch {
    programmeEntries.value = []
  } finally {
    loadingEntries.value = false
  }
}

// ── Reference data ────────────────────────────────────────────────────────────
const provinces = ref<Province[]>([])
const categories = ref<Category[]>([])
const loadingProvinces = ref(false)
const loadingCategories = ref(false)

async function loadProvinces() {
  if (provinces.value.length) return
  loadingProvinces.value = true
  try {
    const res = await memberApi.getProvinces()
    provinces.value = unwrapData(res.data) || []
  } catch {
    provinces.value = []
  } finally {
    loadingProvinces.value = false
  }
}

async function loadCategories() {
  if (categories.value.length) return
  loadingCategories.value = true
  try {
    const cats = await taxonomyApi.list({ force: true })
    categories.value = cats ?? []
  } catch {
    categories.value = []
  } finally {
    loadingCategories.value = false
  }
}

// Clear sub-selections when scope changes to avoid stale values
watch(analysisScope, () => {
  selectedProvince.value = ''
  selectedCategory.value = ''
})

onMounted(() => {
  loadProvinces()
  loadCategories()
  loadProgrammeEntries()
})

// ── File handling ─────────────────────────────────────────────────────────────
function onFileUpdate(f: File | null) {
  selectedFile.value = f
  if (mode.value === 'adviser') {
    errors.value.document = f ? '' : 'Only PDF or Word documents are accepted.'
  } else {
    errors.value.document = ''
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(): boolean {
  const e: Record<string, string> = {}
  if (mode.value === 'adviser') {
    if (!submittingParty.value.trim()) e.submittingParty = 'Submitting party is required.'
    if (!selectedFile.value) e.document = 'A PDF or Word document is required.'
  } else {
    if (!selectedEntryId.value) e.selectedEntry = 'Please select a programme entry.'
  }
  if (analysisScope.value === 'geographic' && !selectedProvince.value) e.province = 'Please select a province.'
  if (analysisScope.value === 'thematic' && !selectedCategory.value) e.category = 'Please select a category.'
  errors.value = e
  return Object.keys(e).length === 0
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  submitError.value = null
  if (!validate()) return

  let scopeValue = 'full map'
  let scopeDetail: string | null = null

  if (analysisScope.value === 'geographic') {
    scopeValue = 'geographic subset'
    const prov = provinces.value.find(p => String(p.id) === selectedProvince.value)
    scopeDetail = prov?.province_name ?? selectedProvince.value
  } else if (analysisScope.value === 'thematic') {
    scopeValue = 'thematic subset'
    const cat = categories.value.find(c => String(c.id) === selectedCategory.value)
    scopeDetail = (cat as any)?.label ?? cat?.name ?? selectedCategory.value
  }

  // Determine submitting_party and document_name based on mode
  let partyName: string
  let docName: string

  if (mode.value === 'entity' && selectedEntryObj.value) {
    partyName = selectedEntryObj.value.organisation_name || selectedEntryObj.value.name
    docName = selectedFile.value?.name ?? `${selectedEntryObj.value.name} Record`
  } else {
    partyName = submittingParty.value.trim()
    docName = selectedFile.value ? selectedFile.value.name : 'Document'
  }

  try {
    const payload: any = {
      submitting_party: partyName,
      document_name: docName,
      analysis_scope: scopeValue,
      analysis_scope_detail: scopeDetail ?? null,
    }

    // If a programme entry is selected (entity mode), link it
    if (selectedEntryId.value) {
      payload.programme_entry_id = Number(selectedEntryId.value)
    }

    // Assignment
    if (assignedTo.value !== 'unassigned') {
      payload.coordinator_id = Number(assignedTo.value)
    }

    const created = await adviserStore.submitDocument(payload, selectedFile.value || undefined)

    // Non-member path: parse the document immediately and cache the text for AI analysis
    if (mode.value === 'adviser' && selectedFile.value && created?.id) {
      try {
        const parseRes = await adviserApi.parsePdf(created.id, selectedFile.value)
        const text = (parseRes.data as any)?.text
        if (text) adviserStore.storeParsedText(created.id, text)
      } catch {
        // non-fatal — AI analysis will still run but without document text
      }
    }

    router.push('/adviser')
  } catch (err: any) {
    submitError.value = err?.response?.data?.message ?? 'Submission failed. Please try again.'
  }
}

function cancel() {
  router.push('/adviser')
}

function switchMode(newMode: 'adviser' | 'entity') {
  router.push({ query: newMode === 'entity' ? {} : { mode: 'adviser' } })
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-200/40 p-8 sm:p-10 relative overflow-hidden">
    <!-- Top Gradient Accent Line -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#0F5A4D] to-teal-500"></div>

    <!-- Title & Subtitle inside Card Container -->
    <div class="mb-7 pb-6 border-b border-slate-100">
      <h1 class="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">Submit a document for analysis</h1>
      <p class="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
        The document does not need to be from a member. Submission is recorded for audit purposes only.
      </p>
    </div>

    <div class="space-y-7">
      <!-- Segmented Mode Tabs -->
      <div class="bg-slate-100/90 p-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200/70 shadow-2xs">
        <button
          type="button"
          @click="switchMode('entity')"
          class="flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          :class="mode === 'entity'
            ? 'bg-white text-[#0F5A4D] shadow-xs border border-slate-200/60 scale-[1.01]'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0" :class="mode === 'entity' ? 'bg-[#0F5A4D]/10 text-[#0F5A4D]' : 'text-slate-400'">
            <BaseIcon name="check" size="13" />
          </div>
          <span>Member in the System</span>
        </button>
        <button
          type="button"
          @click="switchMode('adviser')"
          class="flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          :class="mode === 'adviser'
            ? 'bg-white text-[#0F5A4D] shadow-xs border border-slate-200/60 scale-[1.01]'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0" :class="mode === 'adviser' ? 'bg-[#0F5A4D]/10 text-[#0F5A4D]' : 'text-slate-400'">
            <BaseIcon name="bolt" size="13" />
          </div>
          <span>Not in the System</span>
        </button>
      </div>

      <!-- Submitting party (text input for Adviser mode) -->
      <div v-if="mode === 'adviser'">
        <label class="block text-[15px] font-bold text-gray-900 mb-2">Submitting Party</label>
        <p class="text-xs text-gray-500 mb-2">Name of the organisation or individual. They are not registered in the system — a document upload is required.</p>
        <input
          v-model="submittingParty"
          type="text"
          placeholder="Organisation or individual name"
          class="w-full border rounded-lg px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F5A4D]/20 focus:border-[#0F5A4D] transition"
          :class="errors.submittingParty
            ? 'border-red-400 focus:ring-red-300'
            : 'border-gray-200'"
        />
        <p v-if="errors.submittingParty" class="mt-2 text-[13px] text-red-500">
          {{ errors.submittingParty }}
        </p>
      </div>

      <!-- Select Existing Programme Entry (Inline Combobox & Selected Entry Card) -->
      <div v-else class="space-y-2">
        <label class="block text-[15px] font-bold text-gray-900">
          Select Programme Entry
        </label>
        <p class="text-xs text-gray-500 mb-2">
          This member has already submitted their programme in the system. Select it below — no file upload needed.
        </p>

        <!-- If ALREADY Selected: Show Selected Entry Card -->
        <div v-if="selectedEntryObj" class="p-4 rounded-xl border border-[#0F5A4D]/30 bg-[#F4FBFA] flex items-center justify-between gap-4 shadow-2xs">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-[#0F5A4D] text-white flex items-center justify-center shrink-0">
              <BaseIcon name="check" size="18" />
            </div>
            <div class="min-w-0">
              <div class="text-[14px] font-bold text-gray-900 truncate">
                {{ selectedEntryObj.name }}
              </div>
              <div class="text-xs text-gray-600 truncate mt-0.5">
                {{ selectedEntryObj.organisation_name || 'Registered Organisation' }} · Entry #{{ selectedEntryObj.id }}
              </div>
            </div>
          </div>
          <button
            type="button"
            @click="clearSelectedEntry"
            class="px-3.5 py-1.5 text-xs font-semibold text-[#0F5A4D] bg-white border border-[#0F5A4D]/30 rounded-lg hover:bg-[#0F5A4D]/10 transition cursor-pointer shrink-0"
          >
            Change selection
          </button>
        </div>

        <!-- If NOT Selected: Search Input & Inline Dropdown -->
        <div v-else class="relative">
          <!-- Click outside overlay -->
          <div v-if="isDropdownOpen" class="fixed inset-0 z-30" @click="isDropdownOpen = false"></div>

          <div class="relative z-40">
            <input
              v-model="entrySearchInput"
              type="text"
              placeholder="Type programme name or organisation to search..."
              @focus="isDropdownOpen = true"
              class="w-full border rounded-lg px-4 py-3 pl-10 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F5A4D]/20 focus:border-[#0F5A4D] transition"
              :class="errors.selectedEntry ? 'border-red-400' : 'border-gray-200'"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <!-- Dropdown list -->
          <div
            v-if="isDropdownOpen"
            class="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-gray-100"
          >
            <div v-if="loadingEntries" class="p-4 text-center text-xs text-gray-400">
              Loading programme entries...
            </div>
            <div v-else-if="filteredEntries.length === 0" class="p-4 text-center text-xs text-gray-400">
              No matching programme entries found.
            </div>
            <button
              v-else
              v-for="entry in filteredEntries"
              :key="entry.id"
              type="button"
              @click="selectEntry(entry)"
              class="w-full text-left px-4 py-3 hover:bg-[#F4FBFA] transition flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div>
                <div class="text-[13.5px] font-bold text-gray-800 group-hover:text-[#0F5A4D]">
                  {{ entry.name }}
                </div>
                <div v-if="entry.organisation_name" class="text-xs text-gray-500 mt-0.5">
                  {{ entry.organisation_name }}
                </div>
              </div>
              <span class="text-[11px] text-gray-400 font-mono">#{{ entry.id }}</span>
            </button>
          </div>
        </div>
        <p v-if="errors.selectedEntry" class="mt-1 text-[13px] text-red-500">
          {{ errors.selectedEntry }}
        </p>
      </div>

      <!-- Document upload -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-[15px] font-bold text-gray-900">Document</label>
          <span v-if="mode === 'entity'" class="text-xs text-emerald-600 font-medium">Optional — programme data already in system</span>
          <span v-else class="text-xs text-red-500 font-medium">Required — party not in system</span>
        </div>
        <FormFileUpload
          :model-value="selectedFile"
          :error="errors.document"
          :hide-label="true"
          @update:model-value="onFileUpdate"
        />
      </div>

      <!-- Analysis scope + conditional province / category sub-selects -->
      <FormScopeSelect
        v-model="analysisScope"
        v-model:province="selectedProvince"
        v-model:category="selectedCategory"
        :provinces="provinces"
        :categories="categories"
        :loading-provinces="loadingProvinces"
        :loading-categories="loadingCategories"
        :error-province="errors.province"
        :error-category="errors.category"
      />

      <!-- Assign to coordinator -->
      <FormCoordinatorSelect
        v-model="assignedTo"
      />

      <!-- Server error -->
      <p v-if="submitError" class="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-5 py-4">
        {{ submitError }}
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
        <BaseButton variant="secondary" @click="cancel">
          Cancel
        </BaseButton>
        <BaseButton variant="primary" @click="handleSubmit" :disabled="adviserStore.submitting">
          <svg v-if="adviserStore.submitting" class="animate-spin h-4 w-4 shrink-0 mr-1" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ adviserStore.submitting ? 'Submitting…' : 'Continue →' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>