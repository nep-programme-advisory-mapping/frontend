<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User } from '@/types/user'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const props = defineProps<{
  currentStatus: string
  assigneeId: number | null
  coordinators: Array<{ id: number; name: string; email?: string }>
  deliveredAt?: string | null
  finalNoteFileUrl?: string | null
}>()

const emit = defineEmits<{
  'update:assigneeId': [value: number | null]
  upload: []
  'open-file': []
}>()

const assigneeName = computed(() => {
  if (!props.assigneeId) return null
  const u = props.coordinators.find(c => c.id === props.assigneeId)
  return u ? (u.name ?? u.email ?? `User #${props.assigneeId}`) : `User #${props.assigneeId}`
})

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'just now'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function onSelectChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  emit('update:assigneeId', val === '' ? null : Number(val))
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <h2 class="text-[14px] font-bold text-gray-900 mb-6">Workflow</h2>

    <div class="relative pl-8 space-y-7 mt-4 border-l-2 border-gray-100 ml-3">

      <div class="relative">
        <div class="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[#15803D]">
          <BaseIcon name="check" size="14" />
        </div>
        <h3 class="text-[13px] font-bold text-gray-900 leading-none">Document uploaded</h3>
      </div>

      <div class="relative">
        <div class="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[#15803D]">
          <BaseIcon name="check" size="14" />
        </div>
        <h3 class="text-[13px] font-bold text-gray-900 leading-none">AI draft generated</h3>
      </div>

      <div class="relative">
        <div v-if="currentStatus === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED" class="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[#15803D]">
          <BaseIcon name="check" size="14" />
        </div>
        <div v-else class="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-[#FFF4ED] border-4 border-white flex items-center justify-center">
          <div class="w-2.5 h-2.5 bg-[#C2410C] rounded-full"></div>
        </div>

        <template v-if="currentStatus === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED">
          <h3 class="text-[13px] font-bold text-gray-900 leading-none">Advice delivered</h3>
          <p class="text-[12px] text-gray-500 mt-1">{{ formatDate(deliveredAt) }}</p>
        </template>
        <template v-else>
          <h3 class="text-[13px] font-bold text-gray-900 leading-none">Coordinator review</h3>
          <p class="text-[12px] text-gray-500 mt-1">
            In progress<template v-if="assigneeName"> — {{ assigneeName }}</template>
          </p>
        </template>
      </div>
    </div>

    <!-- Divider -->

    <!-- Post-delivery State -->
    <div v-if="currentStatus === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED" class="mt-5 pt-4 border-t border-gray-100">
      <p class="text-[13px] text-gray-900 font-semibold">
        Delivered on <span class="font-normal text-gray-600">{{ formatDate(deliveredAt) }}</span>
      </p>
      <a
        v-if="finalNoteFileUrl"
        href="#"
        @click.prevent="emit('open-file')"
        class="inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold text-[#0F5A4D] hover:underline underline-offset-2"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        Final note: {{ finalNoteFileUrl.split('/').pop() }}
      </a>
    </div>

  </div>
</template>
