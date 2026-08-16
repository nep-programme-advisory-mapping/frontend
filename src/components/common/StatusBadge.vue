<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'warning' | 'success' | 'error' | 'neutral'
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide leading-none whitespace-nowrap"
    :class="{
      'bg-amber-100 text-amber-800 border border-amber-200': variant === 'warning' || !variant,
      'bg-green-100 text-green-800 border border-green-200': variant === 'success',
      'bg-red-100 text-red-800 border border-red-200': variant === 'error',
      'bg-gray-100 text-gray-600 border border-gray-200': variant === 'neutral',
    }"
  >
    <!-- Dot indicator -->
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="{
        'bg-amber-500': variant === 'warning' || !variant,
        'bg-green-500': variant === 'success',
        'bg-red-500': variant === 'error',
        'bg-gray-400': variant === 'neutral',
      }"
    />
    {{ label }}
  </span>
</template>
