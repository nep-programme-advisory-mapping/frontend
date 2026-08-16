<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

interface Recommendation {
  org: string
  type: string
  linked: string
  text: string
}

defineProps<{
  items: Recommendation[]
  fetching?: boolean
  noResults?: boolean
  readonly?: boolean
  profileEmpty?: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  findOverlaps: []
  'update:org': [index: number, value: string]
  'update:type': [index: number, value: string]
  'update:text': [index: number, value: string]
}>()
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
      <div class="flex items-center gap-2.5">
        <h2 class="text-[14.5px] font-bold text-slate-900 tracking-tight">B · Coordination recommendations</h2>
        <span v-if="items.length > 0" class="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
          {{ items.length }} {{ items.length === 1 ? 'match' : 'matches' }}
        </span>
      </div>
      <div v-if="!readonly" class="flex items-center gap-2.5">
        <button
          @click="$emit('add')"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer shadow-2xs"
        >
          + Add Manual
        </button>
      </div>
    </div>
    
    <div class="p-6 space-y-4">
      <!-- Empty State -->
      <div v-if="items.length === 0" class="py-8 px-6 text-center border-2 border-dashed rounded-xl"
        :class="profileEmpty ? 'border-orange-200 bg-orange-50/40' : 'border-slate-200 bg-slate-50/40'"
      >
        <div class="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3"
          :class="profileEmpty ? 'bg-orange-100 text-orange-500' : 'bg-[#0F5A4D]/10 text-[#0F5A4D]'"
        >
          <BaseIcon :name="profileEmpty ? 'alert' : 'search'" size="22" />
        </div>

        <!-- Profile has no structured data -->
        <template v-if="profileEmpty">
          <h3 class="text-sm font-bold text-orange-800">No structured data to compare</h3>
          <p class="text-xs text-orange-600 max-w-sm mx-auto mt-2">
            The linked programme entry has no activities or locations saved. Complete the programme entry first, then run the overlap search.
          </p>
        </template>

        <!-- Searched, nothing found -->
        <template v-else-if="noResults">
          <h3 class="text-sm font-bold text-slate-800">No overlapping programmes found</h3>
          <p class="text-xs text-slate-500 mt-2">
            No programmes in the map share the same geography or activities for this scope. You can add a manual recommendation if needed.
          </p>
        </template>

        <!-- Not searched yet -->
        <template v-else>
          <h3 class="text-sm font-bold text-slate-800">No recommendations yet</h3>
          <p class="text-xs text-slate-500 mt-2">
            Run the overlap query to automatically find programmes with matching geography or activities.
          </p>
        </template>
      </div>
      
      <!-- Recommendation Cards -->
      <div
        v-for="(rec, idx) in items"
        :key="idx"
        class="border hover:border-emerald-300 rounded-xl p-5 bg-white transition-all shadow-2xs relative group"
        :class="!readonly && (!rec.org?.trim() || !rec.text?.trim()) ? 'border-red-300 bg-red-50/30' : 'border-slate-200'"
      >
        <button
          v-if="!readonly"
          @click="$emit('remove', idx)"
          class="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
          title="Remove recommendation"
        >
          ✕
        </button>
        
        <!-- Header row -->
        <div class="flex flex-wrap items-center gap-3 mb-3 pr-8">
          <input 
            type="text" 
            :value="rec.org"
            @input="!readonly && $emit('update:org', idx, ($event.target as HTMLInputElement).value)"
            :readonly="readonly"
            placeholder="Partner Organisation name" 
            class="font-bold text-[14px] text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 min-w-[220px] focus:outline-none focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D]"
            :class="readonly ? 'bg-slate-50 cursor-default' : ''"
          />
          <select 
            :value="rec.type"
            @change="!readonly && $emit('update:type', idx, ($event.target as HTMLSelectElement).value)"
            :disabled="readonly"
            class="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:border-[#0F5A4D]"
            :class="readonly ? 'cursor-default opacity-100' : ''"
          >
            <option>Geographic & Activity overlap</option>
            <option>Geographic overlap</option>
            <option>Thematic overlap</option>
            <option>Thematic adjacency</option>
          </select>

          <!-- Type Badge -->
          <span
            class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider"
            :class="{
              'bg-emerald-100 text-emerald-800': rec.type.includes('Geographic') && rec.type.includes('Activity'),
              'bg-teal-100 text-teal-800': rec.type.includes('Geographic') && !rec.type.includes('Activity'),
              'bg-indigo-100 text-indigo-800': rec.type.includes('Thematic'),
            }"
          >
            {{ rec.type }}
          </span>
        </div>
        
        <!-- Linked entry & Description -->
        <div class="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <span class="text-slate-400">Linked Map Entry:</span>
          <span class="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {{ rec.linked }}
          </span>
        </div>
        <textarea 
          :value="rec.text"
          @input="!readonly && $emit('update:text', idx, ($event.target as HTMLTextAreaElement).value)"
          :readonly="readonly"
          class="w-full text-[13.5px] text-slate-700 border border-slate-200 hover:border-slate-300 focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D] rounded-lg p-3 transition-all min-h-[70px] resize-y outline-none bg-slate-50/50" 
          :class="readonly ? 'cursor-default' : ''"
          placeholder="Describe the coordination recommendation..."
        ></textarea>
      </div>
    </div>
  </div>
</template>