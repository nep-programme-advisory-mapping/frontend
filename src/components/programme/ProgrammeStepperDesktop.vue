<script setup lang="ts">
import { useProgrammeFormStore } from '@/stores/programmeForm'

const store = useProgrammeFormStore()

const emit = defineEmits<{
  (e: 'go-to-step', stepNumber: number): void
}>()
</script>

<template>
  <aside class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <ul class="divide-y divide-gray-100">
      <li v-for="step in store.steps" :key="step.number"
        class="flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer select-none"
        :class="step.number === store.currentStep ? 'bg-teal-50' : 'hover:bg-gray-50'" @click="emit('go-to-step', step.number)">
        <!-- Step bubble: checkmark if done, number otherwise -->
        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          :class="store.completedSteps.has(step.number)
              ? 'bg-green-600 text-white'
              : step.number === store.currentStep
                ? 'bg-teal-800 text-white'
                : 'bg-gray-100 text-gray-500'
            ">
          <svg v-if="store.completedSteps.has(step.number)" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <template v-else>{{ step.number }}</template>
        </span>

        <div>
          <p class="text-sm font-semibold" :class="step.number === store.currentStep ? 'text-teal-900' : 'text-gray-600'">
            {{ step.title }}
          </p>
          <p class="text-xs text-gray-400 mt-0.5">{{ step.subtitle }}</p>
        </div>
      </li>
    </ul>

    <!-- Section Progress -->
    <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Section progress</span>
        <span class="font-semibold text-gray-700">{{ store.currentStep }} of {{ store.steps.length }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-1.5">
        <div class="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
          :style="{ width: store.progressPercent + '%' }" />
      </div>
    </div>
  </aside>
</template>
