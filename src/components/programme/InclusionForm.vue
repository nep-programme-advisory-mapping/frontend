<script setup lang="ts">
import { useProgrammeActivitiesStore } from '@/stores/programmeActivities'
import { GROUPS_CONFIG } from '@/constants/taxonomy'

defineProps<{
  itemCode: string
}>()

const store = useProgrammeActivitiesStore()
</script>

<template>
  <!-- Yes/No Toggle -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-4">
    <span class="text-xs font-bold text-slate-800">Specific inclusion focus?</span>
    <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
      <button
        type="button"
        @click="store.updateInclusionToggle(itemCode, true)"
        class="px-4 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
        :class="store.inclusions[itemCode]?.hasInclusion ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
      >
        Yes
      </button>
      <button
        type="button"
        @click="store.updateInclusionToggle(itemCode, false)"
        class="px-4 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
        :class="!store.inclusions[itemCode]?.hasInclusion ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
      >
        No
      </button>
    </div>
  </div>

  <!-- Group & Type Selection (conditionally visible when toggled "yes") -->
  <div v-if="store.inclusions[itemCode]?.hasInclusion" class="space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
    <span class="text-[11px] font-bold text-slate-500 block">Target Groups & Inclusion Types (Type A: Inclusive design | Type B: Targeted programme)</span>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div
        v-for="group in GROUPS_CONFIG"
        :key="group.name"
        class="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50 flex flex-col gap-1.5"
      >
        <!-- Group Checkbox -->
        <div
          @click="store.toggleGroupSelection(itemCode, group.name)"
          class="inline-flex items-center text-xs font-bold text-slate-700 cursor-pointer select-none group/groupitem"
        >
          <input
            type="checkbox"
            :checked="store.isGroupSelected(itemCode, group.name)"
            class="sr-only"
          />
          <!-- Custom Checkbox -->
          <div
            class="h-4 w-4 rounded border flex items-center justify-center transition-all duration-200 mr-2 shrink-0 pointer-events-none"
            :class="store.isGroupSelected(itemCode, group.name)
              ? 'border-teal-700 bg-teal-700 text-white shadow-sm'
              : 'border-slate-350 bg-white group-hover/groupitem:border-slate-400'"
          >
            <svg v-if="store.isGroupSelected(itemCode, group.name)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span class="pointer-events-none">{{ group.name }}</span>
        </div>

        <!-- Type Selection (Visible only when Group Checkbox is checked) -->
        <div v-if="store.isGroupSelected(itemCode, group.name)" class="pl-6 flex flex-col gap-1.5 border-l-2 border-teal-50 ml-2 animate-fade-in">
          <!-- Type A / Type B options -->
          <div class="flex gap-4">
            <label
              v-if="group.allowsA"
              class="inline-flex items-center text-xs font-semibold text-slate-500 cursor-pointer select-none"
              @click.stop
            >
              <input
                type="radio"
                :name="`type-${itemCode}-${group.name}`"
                value="A"
                :checked="store.getGroupType(itemCode, group.name) === 'A'"
                @change="store.setGroupType(itemCode, group.name, 'A')"
                class="h-3.5 w-3.5 border-slate-300 text-teal-700 focus:ring-teal-500 mr-1.5 cursor-pointer"
              />
              Type A
            </label>

            <label
              class="inline-flex items-center text-xs font-semibold text-slate-500 cursor-pointer select-none"
              @click.stop
            >
              <input
                type="radio"
                :name="`type-${itemCode}-${group.name}`"
                value="B"
                :checked="store.getGroupType(itemCode, group.name) === 'B'"
                @change="store.setGroupType(itemCode, group.name, 'B')"
                class="h-3.5 w-3.5 border-slate-300 text-teal-700 focus:ring-teal-500 mr-1.5 cursor-pointer"
              />
              Type B
            </label>
          </div>

          <!-- Text input for 'Other' -->
          <div v-if="group.name === 'Other'" class="mt-1" @click.stop>
            <input
              type="text"
              placeholder="Specify other focus..."
              :value="store.getGroupOtherText(itemCode)"
              @input="store.setGroupOtherText(itemCode, ($event.target as HTMLInputElement).value)"
              class="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
