<script setup lang="ts">
defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    class="w-full border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-semibold bg-[var(--bg)] text-[var(--ink-700)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)]/20 focus:border-[var(--teal-600)] transition-all cursor-pointer truncate hover:bg-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed"
    @change="onChange"
  >
    <slot />
  </select>
</template>
