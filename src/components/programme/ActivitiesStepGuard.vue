<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@/utils/toast'

const toast = useToast()

const emit = defineEmits<{
  (e: 'request-continue'): void
  (e: 'request-error'): void
}>()

const props = defineProps<{
  valid: boolean
  label?: string
}>()

const label = computed(() => props.label ?? 'Imcomplete is not yet')

function tryContinue() {
  if (!props.valid) {
    toast.error(label.value)
    emit('request-error')
    return
  }
  emit('request-continue')
}
</script>

<template>
  <button
    type="button"
    @click="tryContinue"
    class="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors"
  >
    <slot>Continue →</slot>
  </button>
</template>

