<script setup lang="ts">
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5"
      @click.self="emit('cancel')"
    >
      <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-base font-semibold mb-2">{{ title }}</h3>
        <p class="text-sm text-gray-600 leading-relaxed">{{ message }}</p>
        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            @click="emit('cancel')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-800 hover:bg-teal-700'"
            @click="emit('confirm')"
            :disabled="loading"
          >
            {{ loading ? 'Working…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
