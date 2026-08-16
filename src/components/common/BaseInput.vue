<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  error: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <input
    v-bind="$attrs"
    :type="type"
    :value="modelValue"
    :class="{ 'has-error': error }"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
