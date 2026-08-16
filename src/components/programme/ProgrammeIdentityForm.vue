<script setup lang="ts">
import { ref, watch } from 'vue'
import { BUDGET_BANDS } from '@/constants/programme'
import { useProgrammeIdentityStore } from '@/stores/programmeIdentity'
import { useAiAutofillStore } from '@/stores/aiAutofill'
import { useAuthStore } from '@/stores/auth'
import type { ProgrammeIdentity } from '@/types/programme'

const props = defineProps<{
  modelValue?: ProgrammeIdentity
  errors?: Record<string, string[]>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProgrammeIdentity): void
  (e: 'update:valid', isValid: boolean): void
  (e: 'clear-error', field: string): void
}>()

const store = useProgrammeIdentityStore()
const autofill = useAiAutofillStore()
const authStore = useAuthStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

async function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.name.endsWith('.doc')) {
    autofill.error = 'Old .doc format is not supported. Please save the file as .docx and try again.'
    return
  }

  autofill.uploadedFileName = file.name

  if (file.name.endsWith('.txt')) {
    autofill.text = (autofill.text ? autofill.text + '\n\n' : '') + (await file.text())
    autofill.pendingFile = null
  } else if (file.name.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    autofill.text = (autofill.text ? autofill.text + '\n\n' : '') + result.value
    autofill.pendingFile = null
  } else if (file.name.endsWith('.pdf')) {
    autofill.pendingFile = file
  }
}

// Watch props.modelValue to sync changes down to store (e.g. when loading from API)
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(store.section1Data)) {
      store.initFromPayload(newValue)
    }
  },
  { deep: true, immediate: true }
)

// Watch store.section1Data to emit update back to parent
watch(
  () => store.section1Data,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', newVal)
    }
  },
  { deep: true }
)

// Watch validation status to update:valid
watch(
  () => store.section1Valid,
  (newVal) => {
    emit('update:valid', newVal)
  }
)

// Watchers to clear error and manage rules in real-time
watch(() => store.section1Data.name, () => {
  emit('clear-error', 'programme_name')
  delete store.clientErrors.name
})
watch(() => store.section1Data.startYear, () => {
  emit('clear-error', 'start_year')
  delete store.clientErrors.startYear
  if (store.section1Data.startYear !== null && store.section1Data.endYear !== null && store.section1Data.endYear <= store.section1Data.startYear) {
    store.clientErrors.endYear = 'End year must be greater than start year.'
  } else {
    delete store.clientErrors.endYear
  }
})
watch(() => store.section1Data.endYear, () => {
  emit('clear-error', 'end_year')
  delete store.clientErrors.endYear
  if (store.section1Data.startYear !== null && store.section1Data.endYear !== null && store.section1Data.endYear <= store.section1Data.startYear) {
    store.clientErrors.endYear = 'End year must be greater than start year.'
  } else {
    delete store.clientErrors.endYear
  }
})
watch(() => store.section1Data.isOngoing, (isOngoing) => {
  emit('clear-error', 'ongoing')
  emit('clear-error', 'end_year')
  delete store.clientErrors.endYear
  if (isOngoing) {
    store.section1Data.endYear = null
  }
})
watch(() => store.section1Data.fteStaff, () => {
  emit('clear-error', 'fte_staff')
  delete store.clientErrors.fteStaff
})
watch(() => store.section1Data.budgetBand, () => {
  emit('clear-error', 'budget_band_id')
  delete store.clientErrors.budgetBand
})
watch(() => store.section1Data.directBeneficiaries, () => {
  emit('clear-error', 'direct_beneficiaries')
  delete store.clientErrors.directBeneficiaries
})
watch(() => store.section1Data.indirectBeneficiaries, () => {
  emit('clear-error', 'indirect_beneficiaries')
  delete store.clientErrors.indirectBeneficiaries
})

function validate(): boolean {
  return store.validate()
}

function getData() {
  return store.section1Data
}

defineExpose({ validate, getData })

// Prevent minus sign, 'e' and 'E' on non-negative number inputs
function preventNegativeKey(e: KeyboardEvent) {
  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
    e.preventDefault()
  }
}
</script>

<template>
  <div class="space-y-4">

    <!-- AI-assisted completion panel (admin & coordinator only) -->
    <div v-if="authStore.isCoordinatorOrAdmin" class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="text-sm font-bold text-gray-800">AI-assisted completion</span>
      </div>
      <p class="text-xs text-gray-500 mb-4 leading-relaxed">
        Provide one or more inputs — the AI will pre-fill activities, geography, agreements and keywords across all sections. You can review and adjust each section afterwards.
      </p>

      <div class="space-y-3">
        <!-- Text input -->
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Programme description</label>
          <textarea
            v-model="autofill.text"
            rows="3"
            placeholder="e.g. We provide scholarships and mentoring to help girls stay enrolled through lower secondary school in rural Kampong Cham..."
            class="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-gray-700 placeholder-gray-400"
          />
        </div>

        <!-- URL input -->
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Website URL</label>
          <div class="flex items-center gap-2">
            <input
              v-model="autofill.url"
              type="url"
              placeholder="https://example-ngo.org/programmes/girls-education"
              class="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-gray-700"
            />
            <button
              type="button"
              @click="autofill.fetchUrl"
              :disabled="autofill.isFetchingUrl || !autofill.url.trim()"
              class="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {{ autofill.isFetchingUrl ? 'Fetching...' : 'Fetch' }}
            </button>
          </div>
        </div>

        <!-- File upload -->
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Upload document</label>
          <input ref="fileInputRef" type="file" accept=".pdf,.docx,.txt" class="hidden" @change="onFileUpload" />
          <div
            @click="fileInputRef?.click()"
            class="flex items-center gap-3 px-3.5 py-2.5 border border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/20 rounded-lg cursor-pointer transition-all"
          >
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span class="text-xs text-slate-500">
              <span v-if="autofill.uploadedFileName" class="font-bold text-teal-800">📄 {{ autofill.uploadedFileName }}</span>
              <span v-else>Click to upload (.pdf, .docx, .txt)</span>
            </span>
            <span v-if="autofill.uploadedFileName" class="ml-auto text-[10px] text-slate-400 hover:text-red-500 cursor-pointer" @click.stop="autofill.uploadedFileName = ''; autofill.pendingFile = null">✕ Remove</span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="autofill.error" class="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
        {{ autofill.error }}
      </div>

      <!-- Success -->
      <div v-if="autofill.success" class="mt-3 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 font-semibold">
        ✓ AI autofill applied — activities, geography, agreements and keywords have been pre-filled. Continue through each section to review.
      </div>

      <button
        type="button"
        @click="autofill.run"
        :disabled="autofill.isRunning || autofill.isFetchingUrl"
        class="mt-4 px-4 py-2 text-xs font-bold text-white bg-teal-800 rounded-lg hover:bg-teal-900 transition-colors cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-2"
      >
        <svg v-if="autofill.isRunning" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ autofill.isRunning ? 'Running AI autofill…' : 'Run AI autofill for all sections' }}
      </button>
    </div>

    <!-- Identity fields card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <!-- Programme Name (full width) -->
        <div class="md:col-span-2">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
            Programme name <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            v-model="store.section1Data.name"
            type="text"
            placeholder="Full name as used by your organisation"
            :class="store.inputClass('name', props.errors)"
            :disabled="props.disabled"
            @blur="store.touch('name')"
          />
          <p v-if="store.fieldError('name', props.errors)" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('name', props.errors) }}
          </p>
        </div>

        <!-- Start Year -->
        <div>
          <label for="startYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            Start year <span class="text-red-500">*</span>
          </label>
          <input
            id="startYear"
            v-model.number="store.section1Data.startYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="YYYY"
            :class="store.inputClass('startYear', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @blur="store.touch('startYear')"
          />
          <p
            v-if="store.fieldError('startYear', props.errors)"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('startYear', props.errors) }}
          </p>
        </div>

        <!-- End Year with Ongoing checkbox -->
        <div>
          <label for="endYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            End year <span v-if="!store.section1Data.isOngoing" class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div class="flex-1 min-w-[120px]">
              <input
                id="endYear"
                v-model.number="store.section1Data.endYear"
                type="number"
                :min="store.endYearMin"
                max="2100"
                placeholder="YYYY"
                :disabled="store.isEndYearDisabled || props.disabled"
                :class="[
                  store.inputClass('endYear', props.errors),
                  (store.isEndYearDisabled || props.disabled)
                    ? 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                    : '',
                ]"
                @keydown="preventNegativeKey"
                @blur="store.touch('endYear')"
              />
              <p
                v-if="!store.isEndYearDisabled && store.fieldError('endYear', props.errors)"
                class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ store.fieldError('endYear', props.errors) }}
              </p>
            </div>

            <label
              for="ongoing"
              class="flex items-center gap-2 shrink-0 cursor-pointer text-sm text-gray-600 select-none"
            >
              <input
                id="ongoing"
                v-model="store.section1Data.isOngoing"
                type="checkbox"
                :disabled="props.disabled"
                class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded transition-colors cursor-pointer accent-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              Ongoing
            </label>
          </div>
        </div>

        <!-- FTE Staff -->
        <div>
          <label for="fteStaff" class="block text-sm font-medium text-gray-700 mb-1.5">
            Number of Staff in this Program (<abbr
              title="Full-Time Equivalent Staff Assigned to this Program"
              class="cursor-help no-underline"
            >FTE</abbr>) <span class="text-red-500">*</span>
          </label>
          <input
            id="fteStaff"
            v-model.number="store.section1Data.fteStaff"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 12"
            :class="store.inputClass('fteStaff', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="store.clampNonNegative('fteStaff')"
            @blur="store.touch('fteStaff')"
          />
          <p v-if="store.fieldError('fteStaff', props.errors)" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('fteStaff', props.errors) }}
          </p>
        </div>

        <!-- Budget Band (Annual) -->
        <div>
          <label for="budgetBand" class="block text-sm font-medium text-gray-700 mb-1.5">
            Annual budget band <span class="text-red-500">*</span>
          </label>
          <select
            id="budgetBand"
            v-model="store.section1Data.budgetBand"
            :disabled="props.disabled"
            :class="[
              store.inputClass('budgetBand', props.errors),
              !store.section1Data.budgetBand ? 'text-gray-400' : 'text-gray-900',
            ]"
            @blur="store.touch('budgetBand')"
            @change="store.touch('budgetBand')"
          >
            <option :value="null" disabled>Select a band</option>
            <option v-for="band in BUDGET_BANDS" :key="band" :value="band" class="text-gray-900">
              {{ band }}
            </option>
          </select>
          <p v-if="store.fieldError('budgetBand', props.errors)" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('budgetBand', props.errors) }}
          </p>
        </div>

        <!-- Direct Beneficiaries -->
        <div>
          <label for="directBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Direct beneficiaries per year <span class="text-red-500">*</span>
          </label>
          <input
            id="directBeneficiaries"
            v-model.number="store.section1Data.directBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            :class="store.inputClass('directBeneficiaries', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="store.clampNonNegative('directBeneficiaries')"
            @blur="store.touch('directBeneficiaries')"
          />
          <p
            v-if="store.fieldError('directBeneficiaries', props.errors)"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('directBeneficiaries', props.errors) }}
          </p>
          <p v-else class="mt-1.5 text-xs text-gray-400">
            Individuals who <em>directly</em> receive services from this programme.
          </p>
        </div>

        <!-- Indirect Beneficiaries -->
        <div>
          <label for="indirectBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Indirect beneficiaries per year <span class="text-red-500">*</span>
          </label>
          <input
            id="indirectBeneficiaries"
            v-model.number="store.section1Data.indirectBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            :class="store.inputClass('indirectBeneficiaries', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="store.clampNonNegative('indirectBeneficiaries')"
            @blur="store.touch('indirectBeneficiaries')"
          />
          <p
            v-if="store.fieldError('indirectBeneficiaries', props.errors)"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('indirectBeneficiaries', props.errors) }}
          </p>
          <p v-else class="mt-1.5 text-xs text-gray-400">Use your organisation's own definition.</p>
        </div>

      </div>
    </div>
    </div>
  </div>
</template>
