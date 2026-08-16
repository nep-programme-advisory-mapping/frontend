<script setup lang="ts">
import Icon from '@/components/common/BaseIcon.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: 'No matching entries found',
    description: 'Try adjusting or clearing your filters.'
  }
)
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-14 text-center px-6">
    <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-1">
      <Icon name="search" size="24" class="text-gray-400" />
    </div>
    <p class="text-sm font-semibold text-gray-700">{{ title }}</p>
    <p class="text-xs text-gray-400 max-w-xs">{{ description }}</p>
    <slot />
  </div>
</template>
