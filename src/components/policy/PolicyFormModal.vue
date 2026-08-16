<script setup lang="ts">
import { reactive, watch } from 'vue'
import Icon from '@/components/common/BaseIcon.vue'
import FormFileUpload from '@/components/adviser/FormFileUpload.vue'
import type { PolicyDocument, PolicyFormPayload } from '@/types/policy'

const props = defineProps<{
  show: boolean
  initialData?: PolicyDocument | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: PolicyFormPayload): void
}>()

const form = reactive({ title: '', authority: '', version: '', date: '', status: 'active' as 'active' | 'superseded' | 'inactive', file: null as File | null })
const errors = reactive({ title: '', authority: '', version: '', date: '', file: '' })

// Reset or populate form when modal opens
watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.initialData) {
        form.title = props.initialData.title
        form.authority = props.initialData.authority
        form.version = props.initialData.version
        form.date = props.initialData.date ? props.initialData.date.substring(0, 10) : ''
        form.status = props.initialData.status
      } else {
        form.title = ''
        form.authority = ''
        form.version = ''
        form.date = ''
        form.status = 'active'
      }
      form.file = null
      errors.title = ''
      errors.authority = ''
      errors.version = ''
      errors.date = ''
      errors.file = ''
    }
  }
)

function submit() {
  errors.title = form.title.trim() ? '' : 'Title is required.'
  errors.authority = form.authority.trim() ? '' : 'Issuing authority is required.'
  errors.version = form.version.trim() ? '' : 'Version is required.'
  errors.date = form.date ? '' : 'Date is required.'

  if (Object.values(errors).some(Boolean)) return

  emit('submit', {
    title: form.title.trim(),
    authority: form.authority.trim(),
    version: form.version.trim(),
    date: form.date,
    status: form.status,
    file: form.file ?? undefined,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 bg-black/45 flex items-center justify-center z-150 p-5 backdrop-blur-[2px]" @click.self="emit('close')">
      <div class="bg-white rounded-[14px] shadow-lg w-full max-w-[640px] p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-[16px] font-semibold mb-[14px]">
          {{ initialData ? 'Edit policy document' : 'Add policy document' }}
        </h3>

        <div class="mb-4">
          <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Title</label>
          <input type="text" v-model="form.title"
            class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]"
            :class="{ '!border-[var(--red-600)]': errors.title }" />
          <div v-if="errors.title" class="text-[11.5px] text-[var(--red-600)] mt-1 flex items-center gap-1">
            <Icon name="alert" size="14" /> {{ errors.title }}
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Issuing authority</label>
          <input type="text" v-model="form.authority"
            class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]"
            :class="{ '!border-[var(--red-600)]': errors.authority }" />
          <div v-if="errors.authority" class="text-[11.5px] text-[var(--red-600)] mt-1 flex items-center gap-1">
            <Icon name="alert" size="14" /> {{ errors.authority }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Version</label>
            <input type="text" v-model="form.version" placeholder="e.g. 1.0"
              class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]"
              :class="{ '!border-[var(--red-600)]': errors.version }" />
            <div v-if="errors.version" class="text-[11.5px] text-[var(--red-600)] mt-1 flex items-center gap-1">
              <Icon name="alert" size="14" /> {{ errors.version }}
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Date</label>
            <input type="date" v-model="form.date"
              class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]"
              :class="{ '!border-[var(--red-600)]': errors.date }" />
            <div v-if="errors.date" class="text-[11.5px] text-[var(--red-600)] mt-1 flex items-center gap-1">
              <Icon name="alert" size="14" /> {{ errors.date }}
            </div>
          </div>
        </div>

        <div class="mb-4" v-if="initialData">
          <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Status</label>
          <select v-model="form.status" class="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-[13px] bg-white outline-none focus:border-[var(--teal-500)] focus:ring-1 focus:ring-[var(--teal-500)]">
            <option value="active">Active</option>
            <option value="superseded">Superseded</option>
          </select>
        </div>

        <div class="mb-4 mt-4">
          <FormFileUpload
            v-model="form.file"
            :existing-file-name="initialData?.file_name || (initialData?.file_url ? initialData.file_url.split('/').pop() : undefined)"
            :error="errors.file"
            :compact="true"
          />
        </div>

        <div v-if="!initialData" class="text-[11.5px] text-[var(--ink-500)] mt-4 mb-[18px] leading-normal">
          If a document with this exact title is already active, it will be marked superseded and retained for
          historical reference.
        </div>

        <div class="flex justify-end gap-[10px] mt-[18px]">
          <button @click="emit('close')" class="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button @click="submit" :disabled="submitting" class="btn btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-50">
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ initialData ? 'Save changes' : 'Add document' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
