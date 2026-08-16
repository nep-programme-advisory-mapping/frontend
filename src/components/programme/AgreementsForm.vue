<script setup lang="ts">
import { watch } from 'vue'
import { useProgrammeAgreementsStore } from '@/stores/programmeAgreements'
import type { GovernmentAgreement } from '@/types/programme'

const props = defineProps<{
  modelValue?: GovernmentAgreement[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: GovernmentAgreement[]): void
  (e: 'update:valid', isValid: boolean): void
}>()

const store = useProgrammeAgreementsStore()

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return
    // Only sync from props if it differs from what's already in the store
    // (prevents overwriting AI-filled data when component mounts)
    if (JSON.stringify(val) !== JSON.stringify(store.agreements)) {
      store.initFromPayload(val)
    }
  },
  { immediate: true, deep: true }
)

function emitUpdate() {
  emit('update:modelValue', store.agreements)
  emit('update:valid', store.validateSilent())
}

function validate(): boolean {
  return store.validate()
}

function getData() {
  return store.getData()
}

defineExpose({ validate, getData })
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6 space-y-6">
      <p class="text-sm text-gray-500 leading-relaxed">
        For each government counterpart, indicate the nature and status of the agreement. Leave empty if no government agreement or arrangement is in place.
      </p>

      <!-- Repeatable Rows List -->
      <div class="space-y-6">
        <div
          v-for="(agreement, index) in store.agreements"
          :key="index"
          class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100/80 shadow-sm"
        >
          <!-- Counterpart Dropdown -->
          <div class="col-span-12 md:col-span-5 w-full">
            <label :for="`counterpart-${index}`" class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Counterpart agency
            </label>
            <select
              :id="`counterpart-${index}`"
              v-model="agreement.counterpart_agency"
              @change="emitUpdate"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 bg-white shadow-sm transition-all border-gray-200"
            >
              <option value="" disabled>Select counterpart...</option>
              <option v-for="c in store.COUNTERPARTS" :key="c.value" :value="c.value">
                {{ c.label }}
              </option>
            </select>
          </div>

          <!-- Nature Dropdown -->
          <div class="col-span-12 md:col-span-3 w-full">
            <label :for="`nature-${index}`" class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Nature
            </label>
            <select
              :id="`nature-${index}`"
              v-model="agreement.nature"
              @change="emitUpdate"
              class="w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 bg-white shadow-sm transition-all border-gray-200"
            >
              <option value="" disabled>Select nature...</option>
              <option v-for="n in store.NATURES" :key="n.value" :value="n.value">
                {{ n.label }}
              </option>
            </select>
          </div>

          <!-- Status Dropdown -->
          <div class="col-span-12 md:col-span-3 w-full">
            <label :for="`status-${index}`" class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              :id="`status-${index}`"
              v-model="agreement.status"
              @change="emitUpdate"
              class="w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 bg-white shadow-sm transition-all border-gray-200"
            >
              <option value="" disabled>Select status...</option>
              <option v-for="s in store.STATUSES" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>

          <!-- Remove Button -->
          <div class="col-span-12 md:col-span-1 flex md:justify-center md:pt-7 w-full">
            <button
              type="button"
              @click="store.removeAgreement(index)"
              class="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer shrink-0"
              title="Remove agreement"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <!-- Institution Details (Text Input) -->
          <div class="col-span-12 w-full border-t border-gray-100/80 pt-3.5 mt-1">
            <label :for="`institution-${index}`" class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Institution details <span v-if="agreement.counterpart_agency && agreement.nature && agreement.status" class="text-red-500">*</span>
            </label>
            <input
              :id="`institution-${index}`"
              type="text"
              v-model="agreement.institution_name"
              @input="emitUpdate"
              placeholder="e.g. Kampong Cham Provincial Office of Education"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400 shadow-sm transition-all bg-white"
              :class="store.showInlineErrors && agreement.counterpart_agency && agreement.nature && agreement.status && !agreement.institution_name.trim() ? 'border-red-300 bg-red-50/30 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'"
            />
            <span v-if="store.showInlineErrors && agreement.counterpart_agency && agreement.nature && agreement.status && !agreement.institution_name.trim()" class="text-[11px] text-red-600 mt-1.5 flex items-center gap-1 font-semibold">
              <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Institution details are required.
            </span>
          </div>
        </div>
      </div>

      <!-- Add Button -->
      <div class="pt-2">
        <button
          type="button"
          @click="store.addAgreement"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add agreement
        </button>
      </div>
    </div>
  </div>
</template>
