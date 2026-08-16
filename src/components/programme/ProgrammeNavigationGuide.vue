<script setup lang="ts">
import { useProgrammeFormStore } from '@/stores/programmeForm'

const store = useProgrammeFormStore()
</script>

<template>
  <div class="p-4 border rounded-xl flex gap-3 text-xs shadow-sm bg-blue-50/70 border-blue-200 text-blue-900">
    <span class="shrink-0 mt-0.5">
      <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
    <div>
      <p class="font-semibold mb-0.5 text-blue-950">Guidance</p>
      <p class="leading-relaxed opacity-90">
        <span v-if="!store.completedSteps.has(1)">
          Please complete Step 1 (Programme identity) to unlock and jump to other steps.
        </span>
        <span v-else>
          Step 1 complete — you can save drafts or jump to other steps. Complete steps 1, 2, 3, and 5 to submit. Step 4 (Agreements) is optional.
        </span>
      </p>
    </div>
  </div>
</template>
