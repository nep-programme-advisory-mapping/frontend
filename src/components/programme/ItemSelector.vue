<script setup lang="ts">
import type { TaxonomyItem } from '../../types/taxonomy';

const props = defineProps<{
  items: TaxonomyItem[];
  selectedItemIds: number[];
}>();

const emit = defineEmits<{
  (e: 'update:selectedItemIds', value: number[]): void;
}>();

const toggleItem = (itemId: number, active: boolean) => {
  if (!active) return;
  
  const newSelected = [...props.selectedItemIds];
  const index = newSelected.indexOf(itemId);
  
  if (index === -1) {
    newSelected.push(itemId);
  } else {
    newSelected.splice(index, 1);
  }
  
  emit('update:selectedItemIds', newSelected);
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium text-slate-700">Items</label>
    <div v-if="items.length === 0" class="text-sm text-slate-500 italic py-4">
      Select a sub-category to view available items.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="relative flex items-start"
      >
        <div class="flex h-6 items-center">
          <input
            :id="`item-${item.id}`"
            :name="`item-${item.id}`"
            type="checkbox"
            :disabled="!item.is_active"
            :checked="selectedItemIds.includes(item.id)"
            @change="toggleItem(item.id, item.is_active)"
            class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
        </div>
        <div class="ml-3 text-sm leading-6">
          <label
            :for="`item-${item.id}`"
            :class="[
              'font-medium select-none',
              item.is_active ? 'text-slate-900 cursor-pointer' : 'text-slate-400 line-through cursor-not-allowed'
            ]"
          >
            {{ item.name }}
            <span v-if="!item.is_active" class="ml-2 text-xs font-normal text-slate-400">(Inactive)</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
