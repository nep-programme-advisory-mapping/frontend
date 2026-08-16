<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User } from '@/types/user'

defineProps<{
  open: boolean
  user: User | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <BaseModal :open="open" @close="emit('cancel')">
    <div class="text-center max-w-[380px] mx-auto">
      <!-- Warning Icon -->
      <div class="w-12 h-12 rounded-xl bg-[var(--red-100)] text-[var(--red-600)] flex items-center justify-center mx-auto mb-4">
        <BaseIcon name="alert" :size="22" />
      </div>

      <!-- Content -->
      <h3 class="text-base font-bold text-[var(--ink-900)] mb-2">Deactivate Account</h3>
      <p class="text-[13.5px] text-[var(--ink-500)] leading-relaxed">
        Are you sure you want to deactivate
        <strong class="text-[var(--ink-900)] font-semibold">{{ user?.name ?? 'this account' }}</strong>?
        They will no longer be able to log in.
      </p>

      <!-- Actions -->
      <div class="flex justify-center gap-2.5 mt-5.5">
        <button
          class="btn btn-secondary"
          @click="emit('cancel')"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          class="btn btn-danger"
          @click="emit('confirm')"
          :disabled="isLoading"
        >
          <svg
            v-if="isLoading"
            class="w-3.5 h-3.5 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ isLoading ? 'Deactivating…' : 'Deactivate' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
