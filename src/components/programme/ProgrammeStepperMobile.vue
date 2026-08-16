<script setup lang="ts">
import { useProgrammeFormStore } from '@/stores/programmeForm'

const store = useProgrammeFormStore()

const emit = defineEmits<{
  (e: 'go-to-step', stepNumber: number): void
}>()
</script>

<template>
  <div
    class="lg:hidden w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2 relative select-none flex flex-col gap-2">
    <div class="flex items-center justify-between relative z-10">
      <!-- Background progressive line -->
      <div class="absolute top-[18px] left-[32px] right-[32px] h-1 bg-gray-100 -z-10 rounded-full">
        <div class="bg-teal-600 h-1 rounded-full transition-all duration-500"
          :style="{ width: store.stepperProgressPercent + '%' }"></div>
      </div>

      <!-- Step Bubbles -->
      <div v-for="step in store.steps" :key="step.number" @click="emit('go-to-step', step.number)"
        class="flex flex-col items-center cursor-pointer" :style="{ width: store.stepWidthPercent + '%' }">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 duration-300"
          :class="[
            store.completedSteps.has(step.number)
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
              : step.number === store.currentStep
                ? 'bg-teal-800 border-teal-800 text-white ring-4 ring-teal-100 shadow-md scale-105'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-teal-600 hover:text-teal-700'
          ]">
          <svg v-if="store.completedSteps.has(step.number)" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <template v-else>{{ step.number }}</template>
        </div>
        <span
          class="text-[9px] font-bold mt-1.5 transition-colors text-center hidden xs:block truncate px-1 max-w-full"
          :class="step.number === store.currentStep ? 'text-teal-900 font-extrabold' : 'text-gray-400'">
          {{ step.shortTitle }}
        </span>
      </div>
    </div>

    <!-- Active Step Name Label -->
    <div class="text-center mt-1 pt-2 border-t border-gray-100">
      <span class="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold block">Current Step</span>
      <span class="text-xs font-extrabold text-teal-900 mt-0.5 block animate-fade-in">
        {{ store.currentStep }} · {{ store.currentStepTitle }}
      </span>
    </div>
  </div>
</template>
