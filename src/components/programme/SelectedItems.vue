<script setup lang="ts">
import type { SelectedActivity } from '../../types/taxonomy';
import EducationLevelSelector from './EducationLevelSelector.vue';
import { useTaxonomySelectorStore } from '@/stores/taxonomySelector';

import { GROUPS_CONFIG } from '@/constants/taxonomy';

const store = useTaxonomySelectorStore();

defineProps<{
  selectedItems: SelectedActivity[];
  errors?: Record<number, any>;
}>();
</script>

<template>
  <div class="flex flex-col gap-4 border-t border-slate-200 pt-6 mt-6">
    <h3 class="text-sm font-semibold text-slate-700">Selected Activities ({{ selectedItems.length }})</h3>
    <div v-if="selectedItems.length === 0" class="text-sm text-slate-500 italic py-2">
      No activities selected yet.
    </div>
    
    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="(item, index) in selectedItems"
        :key="item.id"
        class="bg-slate-50 rounded-xl p-5 border border-slate-200 relative group transition-all hover:shadow-sm"
      >
        <!-- Card Header: Title and Remove Button -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <div class="flex-shrink-0 bg-teal-800 rounded flex items-center justify-center w-5 h-5">
              <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-slate-800 text-sm">{{ item.id }} &middot; {{ item.name }}</h4>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Core / Supporting Toggle -->
            <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/90">
              <button
                type="button"
                @click="store.handleUpdateIsPrimary(item.id, true)"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
                :class="item.is_primary
                  ? 'bg-[#0F5A4D] text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'"
              >
                Core
              </button>
              <button
                type="button"
                @click="store.handleUpdateIsPrimary(item.id, false)"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
                :class="!item.is_primary
                  ? 'bg-[#0F5A4D] text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'"
              >
                Supporting
              </button>
            </div>

            <button
              type="button"
              @click="store.handleRemoveItem(item.id)"
              class="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-slate-200/50"
              aria-label="Remove item"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Education Levels Selector -->
        <div class="mt-4">
          <p class="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Education Levels</p>
          <EducationLevelSelector
            :model-value="item.educationLevelIds || []"
            @update:model-value="store.handleUpdateEducationLevels(item.id, $event)"
          />
        </div>
        
        <p v-if="errors?.[index]?.educationLevels" class="mt-2 text-xs text-red-500 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {{ errors[index].educationLevels }}
        </p>

        <!-- Inclusion Sub-form -->
        <div class="border-t border-slate-200/60 pt-4 mt-4 space-y-4">
          <!-- Inclusion Yes/No Toggle -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-xs font-semibold text-slate-700">Specific inclusion focus?</span>
            <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-250">
              <button
                type="button"
                @click="store.updateInclusionToggle(item.id, item.inclusion, true)"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
                :class="item.inclusion?.hasInclusion ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                Yes
              </button>
              <button
                type="button"
                @click="store.updateInclusionToggle(item.id, item.inclusion, false)"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
                :class="!item.inclusion?.hasInclusion ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                No
              </button>
            </div>
          </div>

          <!-- Group & Type Selection (conditionally visible when toggled "yes") -->
          <div v-if="item.inclusion?.hasInclusion" class="bg-white p-4 rounded-lg border border-slate-200 shadow-inner mt-2 space-y-4">
            
            <div v-if="errors?.[index]?.inclusionGroup || errors?.[index]?.inclusionType" class="space-y-1 mb-3">
              <p v-if="errors?.[index]?.inclusionGroup" class="text-xs text-red-500 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ errors[index].inclusionGroup }}
              </p>
              <p v-if="errors?.[index]?.inclusionType" class="text-xs text-red-500 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ errors[index].inclusionType }}
              </p>
            </div>

            <span class="text-xs font-semibold text-slate-700 block mb-2">Target Groups & Inclusion Types (Type A: Inclusive design | Type B: Targeted programme)</span>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="group in GROUPS_CONFIG" 
                :key="group.name"
                class="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col gap-2"
              >
                <!-- Group Checkbox -->
                <label class="inline-flex items-center text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    :checked="store.isGroupSelected(item.inclusion, group.name)"
                    @change="store.toggleGroupSelection(item.id, item.inclusion, group.name)"
                    class="h-4 w-4 border-slate-300 text-indigo-650 focus:ring-indigo-500 mr-2 rounded cursor-pointer"
                  />
                  {{ group.name }}
                </label>

                <!-- Type Selection (Visible only when Group Checkbox is checked) -->
                <div v-if="store.isGroupSelected(item.inclusion, group.name)" class="pl-6 flex flex-col gap-1.5 border-l-2 border-indigo-100 ml-2">
                  <!-- Type A / Type B options -->
                  <div class="flex gap-4">
                    <label 
                      v-if="group.allowsA" 
                      class="inline-flex items-center text-xs font-semibold text-slate-600 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        :name="`type-${item.id}-${group.name}`"
                        value="A"
                        :checked="store.getGroupType(item.inclusion, group.name) === 'A'"
                        @change="store.setGroupType(item.id, item.inclusion, group.name, 'A')"
                        class="h-3.5 w-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-1.5 cursor-pointer"
                      />
                      Type A (Inclusive design)
                    </label>
                    
                    <label 
                      class="inline-flex items-center text-xs font-semibold text-slate-600 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        :name="`type-${item.id}-${group.name}`"
                        value="B"
                        :checked="store.getGroupType(item.inclusion, group.name) === 'B'"
                        @change="store.setGroupType(item.id, item.inclusion, group.name, 'B')"
                        class="h-3.5 w-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-1.5 cursor-pointer"
                      />
                      Type B (Targeted programme)
                    </label>
                  </div>

                  <!-- Text input for 'Other' -->
                  <div v-if="group.name === 'Other'" class="mt-1.5">
                    <input
                      type="text"
                      placeholder="Specify other focus..."
                      :value="store.getGroupOtherText(item.inclusion)"
                      @input="store.setGroupOtherText(item.id, item.inclusion, ($event.target as HTMLInputElement).value)"
                      class="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
