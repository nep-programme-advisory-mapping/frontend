<!-- Stacked toast notifications anchored to the bottom-right corner -->
<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Toast } from '@/composables/useToast'

defineProps<{
  toasts: Toast[]
}>()
</script>

<template>
  <div class="fixed bottom-6 right-8 flex flex-col gap-3 z-[200] pointer-events-none">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="px-5 py-4 bg-[#0F5A4D] text-white rounded-lg flex items-center gap-3.5 shadow-xl min-w-[340px] pointer-events-auto transition-transform"
    >
      <BaseIcon name="check" size="16" class="text-white shrink-0" />
      <span class="font-medium text-[14px] leading-none">{{ t.text }}</span>
    </div>
  </div>
</template>
