<script setup lang="ts">
defineProps({
  label: String,
  hint: String,
  error: String,
})
</script>

<template>
  <div class="field">
    <label v-if="label">{{ label }}</label>
    <slot />
    <div v-if="hint" class="hint">{{ hint }}</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>
