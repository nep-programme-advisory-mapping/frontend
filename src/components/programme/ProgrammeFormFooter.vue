<script setup lang="ts">
import { useProgrammeFormStore } from '@/stores/programmeForm'

const store = useProgrammeFormStore()

const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'continue'): void
}>()
</script>

<template>
  <div class="mt-6 flex items-center justify-end gap-2 w-full sm:w-auto">
    <button v-if="store.currentStep > 1" type="button" @click="emit('go-back')"
      class="flex-1 sm:flex-initial flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
      <span class="sm:hidden">← Back</span>
      <span class="hidden sm:inline">{{ store.backStepLabel }}</span>
    </button>

    <button @click="emit('continue')" :disabled="store.isSaving"
      class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none">
      <svg v-if="store.isSaving" class="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span v-if="store.isSaving">Saving...</span>
      <template v-else>
        <span>
          {{ store.continueButtonText }}
        </span>
      </template>
    </button>
  </div>
</template>
