<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'

defineProps<{
  title: string
  modelValue: string
  badge?: string
  badgeTone?: 'teal' | 'amber' | 'green' | 'red' | 'indigo' | 'gray'
  placeholder?: string
  isInternal?: boolean
  showAdd?: boolean
  addLabel?: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  add: []
}>()
</script>

<template>
  <div 
    class="rounded-xl shadow-sm overflow-hidden flex flex-col"
    :class="isInternal 
      ? 'bg-rose-50/30 border border-rose-200/60' 
      : 'bg-white border border-gray-200'"
  >
    <div 
      class="px-6 py-4 border-b flex items-center justify-between"
      :class="isInternal 
        ? 'border-b-rose-200/60 bg-rose-50/50' 
        : 'border-b-gray-100 bg-gray-50/50'"
    >
      <h2 
        class="text-[14px] font-bold"
        :class="isInternal ? 'text-rose-900' : 'text-gray-900'"
      >
        {{ title }}
      </h2>
      <div class="flex items-center gap-2">
        <BaseBadge v-if="badge" :tone="badgeTone ?? 'indigo'" dot>{{ badge }}</BaseBadge>
        <button 
          v-if="showAdd" 
          @click="$emit('add')" 
          class="text-[13px] text-gray-500 hover:text-gray-900 font-semibold"
        >
          {{ addLabel || '+ Add' }}
        </button>
      </div>
    </div>
    <div 
      class="p-6 transition-all rounded-b-xl"
      :class="isInternal 
        ? 'focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-300' 
        : 'focus-within:ring-2 focus-within:ring-[#0F5A4D]/20 focus-within:border-[#0F5A4D]'"
    >
      <textarea 
        :value="modelValue"
        @input="!readonly && $emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="readonly ? '' : placeholder"
        :readonly="readonly"
        class="w-full text-sm leading-relaxed resize-y min-h-[220px] border-none focus:ring-0 p-0 outline-none font-medium"
        :class="[isInternal ? 'text-rose-900 bg-transparent placeholder-rose-300' : 'text-slate-800', readonly ? 'cursor-default select-text' : '']"
      ></textarea>
    </div>
  </div>
</template>