<script setup lang="ts">
const DOT_COLOR = {
  teal: 'var(--teal-700)',
  amber: 'var(--amber-700)',
  green: 'var(--green-700)',
  red: 'var(--red-600)',
  indigo: 'var(--indigo-600)',
  gray: 'var(--ink-500)',
} as const

type Tone = keyof typeof DOT_COLOR

const props = defineProps({
  tone: { type: String as () => Tone, default: 'gray' as Tone },
  dot: { type: Boolean, default: false },
})

const dotColor = DOT_COLOR[props.tone] ?? DOT_COLOR.gray
</script>

<template>
  <span class="badge" :class="`badge-${tone}`">
    <span v-if="dot" class="badge-dot" :style="{ background: dotColor }"></span>
    <slot />
  </span>
</template>
