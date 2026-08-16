<script setup lang="ts">
interface Gap {
  text: string
}

defineProps<{
  items: Gap[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
  'update:text': [index: number, value: string]
}>()
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
      <h2 class="text-[14px] font-bold text-gray-900">C · Gaps in the map</h2>
      <button v-if="!readonly" @click="$emit('add')" class="text-[13px] text-gray-500 hover:text-gray-900 font-semibold">+ Add</button>
    </div>
    
    <div class="p-6 space-y-4">
      <p v-if="items.length === 0" class="text-[13.5px] text-gray-600">No gaps recorded.</p>
      
      <div v-for="(gap, idx) in items" :key="idx" class="border border-gray-200 rounded-lg p-5 bg-white relative group">
        <button v-if="!readonly" @click="$emit('remove', idx)" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition">✕</button>
        <textarea 
          :value="gap.text"
          @input="!readonly && $emit('update:text', idx, ($event.target as HTMLTextAreaElement).value)"
          :readonly="readonly"
          class="w-full text-[13.5px] text-gray-600 border border-transparent hover:border-gray-200 focus:border-[#0F5A4D] focus:ring-1 focus:ring-[#0F5A4D] rounded-md p-2 -ml-2 transition-all min-h-[60px] resize-y outline-none" 
          :class="readonly ? 'cursor-default' : ''"
          placeholder="Describe the gap..."
        ></textarea>
      </div>
    </div>
  </div>
</template>