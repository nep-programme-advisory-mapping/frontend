<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  border?: boolean
  mb?: string
}>()
</script>

<template>
  <div 
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2"
    :class="[
      border ? 'border-b border-slate-100 pb-5' : '',
      mb || 'mb-8'
    ]"
  >
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
        {{ subtitle }}
      </p>
    </div>
    
    <div v-if="$slots.default" class="flex items-center gap-2 flex-wrap shrink-0 self-start sm:self-auto">
      <slot />
    </div>
  </div>
</template>
