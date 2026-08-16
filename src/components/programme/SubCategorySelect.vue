<script setup lang="ts">
import { computed } from 'vue';
import type { SubCategory } from '../../types/taxonomy';

const props = defineProps<{
  modelValue: number | null;
  subCategories: SubCategory[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const selectedSubCategoryId = computed({
  get: () => props.modelValue || '',
  set: (val: number | '') => emit('update:modelValue', val === '' ? null : Number(val)),
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label for="sub-category" class="text-sm font-medium text-slate-700">Sub-category</label>
    <select
      id="sub-category"
      v-model="selectedSubCategoryId"
      :disabled="disabled || subCategories.length === 0"
      class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
    >
      <option value="" disabled>Select a sub-category...</option>
      <option v-for="subCategory in subCategories" :key="subCategory.id" :value="subCategory.id">
        {{ subCategory.name }}
      </option>
    </select>
  </div>
</template>
