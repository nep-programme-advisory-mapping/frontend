<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  type: { type: String as () => 'button' | 'submit' | 'reset', default: 'button' },
})
</script>

<template>
  <button
    v-bind="$attrs"
    :type="type"
    class="btn"
    :class="[`btn-${variant}`, size === 'sm' ? 'btn-sm' : '']"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
