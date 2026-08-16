<!-- Analysis scope selector: full map / geographic (province) / thematic (category) -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Province } from '@/types/programmeGeographic'
import type { Category } from '@/types/taxonomy'

const props = defineProps<{
  modelValue: 'full_map' | 'geographic' | 'thematic'
  province: string
  category: string
  provinces: Province[]
  categories: Category[]
  loadingProvinces?: boolean
  loadingCategories?: boolean
  errorProvince?: string
  errorCategory?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [scope: 'full_map' | 'geographic' | 'thematic']
  'update:province': [value: string]
  'update:category': [value: string]
}>()

const scopeOptions = [
  { value: 'full_map',   label: 'Full map (default)' },
  { value: 'geographic', label: 'Geographic subset' },
  { value: 'thematic',   label: 'Thematic subset' },
] as const

const showProvince = computed(() => props.modelValue === 'geographic')
const showCategory = computed(() => props.modelValue === 'thematic')
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-[14.5px] font-bold text-slate-900 mb-1.5">Analysis scope</label>

      <select
        :value="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as any)"
        class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#0F5A4D] focus:ring-4 focus:ring-[#0F5A4D]/10 bg-white transition cursor-pointer shadow-2xs font-medium"
        :class="{ 'border-teal-600 ring-2 ring-teal-500/20': modelValue !== 'full_map' }"
      >
        <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <p class="mt-2 text-xs text-slate-400 font-medium leading-normal">
        Narrowing scope is useful for specific proposals, while full map gives the most complete coordination picture.
      </p>
    </div>

    <!-- Focus province (geographic) -->
    <div v-if="showProvince" class="pt-2">
      <label class="block text-[14px] font-bold text-slate-900 mb-1.5">Focus province</label>
      <select
        :value="province"
        @change="emit('update:province', ($event.target as HTMLSelectElement).value)"
        class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#0F5A4D] focus:ring-4 focus:ring-[#0F5A4D]/10 bg-white transition cursor-pointer font-medium"
        :class="errorProvince ? 'border-red-400' : 'border-slate-200'"
      >
        <option value="">{{ loadingProvinces ? 'Loading…' : 'Select a province' }}</option>
        <option v-for="p in provinces" :key="p.id" :value="String(p.id)">
          {{ p.province_name }}
        </option>
      </select>
      <p v-if="errorProvince" class="mt-1.5 text-xs text-red-500 font-medium">{{ errorProvince }}</p>
    </div>

    <!-- Focus category (thematic) -->
    <div v-if="showCategory" class="pt-2">
      <label class="block text-[14px] font-bold text-slate-900 mb-1.5">Focus activity category</label>
      <select
        :value="category"
        @change="emit('update:category', ($event.target as HTMLSelectElement).value)"
        class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#0F5A4D] focus:ring-4 focus:ring-[#0F5A4D]/10 bg-white transition cursor-pointer font-medium"
        :class="errorCategory ? 'border-red-400' : 'border-slate-200'"
      >
        <option value="">{{ loadingCategories ? 'Loading…' : 'Select a category' }}</option>
        <option v-for="c in categories" :key="c.id" :value="String(c.id)">
          {{ (c as any).label ?? c.name }}
        </option>
      </select>
      <p v-if="errorCategory" class="mt-1.5 text-xs text-red-500 font-medium">{{ errorCategory }}</p>
    </div>
  </div>
</template>
