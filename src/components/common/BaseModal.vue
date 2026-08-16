<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** Override the default card width (number = px, or a CSS width string). */
  maxWidth: { type: [Number, String], default: 460 },
})
const emit = defineEmits(['close'])

const cardStyle = computed(() => ({
  maxWidth: typeof props.maxWidth === 'number' ? props.maxWidth + 'px' : props.maxWidth,
}))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 bg-[rgba(10,25,22,0.5)] backdrop-blur-[3px] flex items-center justify-center z-[150] p-5" @click.self="emit('close')">
        <div
          class="bg-white rounded-2xl shadow-[0_20px_60px_rgba(10,45,41,0.18),0_2px_8px_rgba(10,45,41,0.08)] w-full max-h-[90vh] overflow-y-auto p-4 sm:p-[26px]"
          :style="cardStyle"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Transition ── */
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active > div {
  transition: transform 0.15s ease;
}
.modal-enter-from > div {
  transform: translateY(12px) scale(0.97);
}
.modal-leave-to > div {
  transform: translateY(6px) scale(0.99);
}
</style>
