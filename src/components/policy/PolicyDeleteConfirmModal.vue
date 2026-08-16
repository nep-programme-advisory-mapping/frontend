<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { PolicyDocument } from '@/types/policy'

defineProps<{
  show: boolean
  document: PolicyDocument | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-150 p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[440px] overflow-hidden p-6 animate-scale-up" @click.stop>
          <!-- Warning Icon -->
          <div class="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 ring-8 ring-rose-50">
            <BaseIcon name="trash" :size="22" />
          </div>

          <!-- Title & Description -->
          <div class="text-center mb-5">
            <h3 class="text-base font-bold text-slate-900">Delete policy document?</h3>
            <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to delete this document? This action is permanent and cannot be undone.
            </p>
          </div>

          <!-- Document Card Preview -->
          <div v-if="document" class="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 mb-6 text-left">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                <BaseIcon name="book" :size="14" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-900 truncate" :title="document.title">
                  {{ document.title }}
                </p>
                <p class="text-[11px] text-slate-500 truncate mt-0.5">
                  {{ document.authority }} • v{{ document.version }}
                </p>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="emit('close')"
              :disabled="submitting"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="emit('confirm')"
              :disabled="submitting"
              class="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm hover:shadow transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ submitting ? 'Deleting...' : 'Delete Document' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
