<!-- Coordinator assignment dropdown -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adviserApi } from '@/api/adviser.api'
import type { User } from '@/types/user'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const coordinators = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await adviserApi.listCoordinators()
    coordinators.value = res.data?.data ?? []
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.response?.status || err.message || 'Failed to load coordinators.'
    console.error('[CoordinatorSelect] Error:', error.value)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <label class="block text-[14.5px] font-bold text-slate-900 mb-1.5">Assign to coordinator</label>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center gap-2 text-slate-400 text-xs mb-2 font-medium">
      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Loading coordinators…
    </div>

    <!-- Warning when query returns zero results -->
    <div v-else-if="coordinators.length === 0" class="text-amber-600 text-xs mb-2 font-medium">
      ⚠ No coordinators found in the system.
    </div>

    <select
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#0F5A4D] focus:ring-4 focus:ring-[#0F5A4D]/10 bg-white transition cursor-pointer shadow-2xs font-medium"
      :disabled="loading"
    >
      <option value="unassigned">Unassigned — leave in shared queue</option>
      <option
        v-for="coordinator in coordinators"
        :key="coordinator.id"
        :value="String(coordinator.id)"
      >
        {{ coordinator.name }}
      </option>
    </select>
  </div>
</template>