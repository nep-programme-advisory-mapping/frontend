<script setup lang="ts">
import { computed, watch } from 'vue';
import { mockTaxonomies } from '../../constants/taxonomy';
import CategorySelect from './CategorySelect.vue';
import SubCategorySelect from './SubCategorySelect.vue';
import ItemSelector from './ItemSelector.vue';
import SelectedItems from './SelectedItems.vue';
import { useTaxonomySelectorStore } from '@/stores/taxonomySelector';

const props = defineProps<{
  serverErrors?: Record<string, string[]>
}>();

const emit = defineEmits<{
  (e: 'save', payload: { activities: { activity_id: number; education_level_ids: number[]; inclusion?: any }[] }): void;
  (e: 'previous'): void;
}>();

const store = useTaxonomySelectorStore();

// Watchers for props mapping
watch(() => props.serverErrors, (newErrors) => {
  if (newErrors) {
    store.mapServerErrors(newErrors);
  }
}, { deep: true, immediate: true });

const handleSave = () => {
  if (!store.validateForm()) return;
  emit('save', store.getSavePayload());
};

const handlePrevious = () => {
  emit('previous');
};
</script>

<template>
  <div class="w-full">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
        <h2 class="text-lg font-semibold text-slate-800">Taxonomy Selection</h2>
        <p class="text-sm text-slate-500 mt-1">Select activities for this programme phase.</p>
      </div>
      
      <div class="p-6">
        <!-- Form Area -->
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Category Selection -->
            <CategorySelect
              v-model="store.selectedCategoryId"
              :categories="mockTaxonomies"
            />
            
            <!-- Sub-category Selection -->
            <SubCategorySelect
              v-model="store.selectedSubCategoryId"
              :sub-categories="store.availableSubCategories"
              :disabled="!store.selectedCategoryId"
            />
          </div>

          <!-- Items Selection -->
          <div class="pt-2">
            <ItemSelector
              :items="store.availableItems"
              :selected-item-ids="store.selectedItemIds"
              @update:selected-item-ids="store.selectedItemIds = $event"
            />
          </div>
        </div>

        <!-- Selected Items View -->
        <SelectedItems
          :selected-items="store.selectedItemsData"
          :errors="store.errors.activities"
        />
      </div>
      
      <!-- Footer actions -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div>
          <p v-if="store.errors.general" class="text-sm font-medium text-red-600 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ store.errors.general }}
          </p>
        </div>
        <div class="flex gap-3">
          <button 
            type="button" 
            @click="handlePrevious"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-350 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
          >
            Previous
          </button>
          <button 
            type="button" 
            @click="handleSave"
            class="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
