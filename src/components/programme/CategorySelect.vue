<script setup lang="ts">
import { computed } from 'vue';
import type { Category } from '../../types/taxonomy';

const props = defineProps<{
  modelValue: number | null;
  categories: Category[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const selectedCategoryId = computed({
  get: () => props.modelValue || '',
  set: (val: number | '') => emit('update:modelValue', val === '' ? null : Number(val)),
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label for="category" class="text-sm font-medium text-slate-700">Category</label>
    <select
      id="category"
      v-model="selectedCategoryId"
      class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
    >
      <option value="" disabled>Select a category...</option>
      <option v-for="category in categories" :key="category.id" :value="category.id">
        {{ category.name }}
      </option>
    </select>
  </div>
</template>
