<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Role } from '@/types/user'

const props = defineProps<{
  open: boolean
  editRole?: Role | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { name?: string; display_name: string; description: string | null }]
}>()

const name = ref('')
const displayName = ref('')
const description = ref('')
const errors = ref<Partial<Record<'name' | 'display_name', string>>>({})

const isEditMode = computed(() => !!props.editRole)
const title = computed(() => (isEditMode.value ? 'Edit Role' : 'Create Role'))

watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    errors.value = {}
    if (props.editRole) {
      name.value = props.editRole.name
      displayName.value = props.editRole.display_name
      description.value = props.editRole.description ?? ''
    } else {
      name.value = ''
      displayName.value = ''
      description.value = ''
    }
  },
)

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function handleDisplayNameInput() {
  // Auto-derive the machine name from the display name on create, so an
  // admin doesn't have to think about naming conventions.
  if (!isEditMode.value) {
    name.value = slugify(displayName.value)
  }
}

function validate(): boolean {
  errors.value = {}
  if (!displayName.value.trim()) errors.value.display_name = 'Display name is required.'
  if (!isEditMode.value && !slugify(name.value)) errors.value.name = 'A valid machine name is required.'
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  if (isEditMode.value) {
    emit('submit', { display_name: displayName.value.trim(), description: description.value.trim() || null })
  } else {
    emit('submit', {
      name: slugify(name.value),
      display_name: displayName.value.trim(),
      description: description.value.trim() || null,
    })
  }
}
</script>

<template>
  <BaseModal :open="open" :max-width="480" @close="emit('close')">
    <div class="w-full">
      <div class="flex items-start gap-3.5 mb-6">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-[0_6px_16px_rgba(15,90,77,0.28)] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)]">
          <BaseIcon :name="isEditMode ? 'edit' : 'plus'" :size="18" />
        </div>
        <div class="flex-1 min-w-0 pt-0.5">
          <h2 class="text-[17px] font-bold tracking-tight text-[var(--ink-900)]">{{ title }}</h2>
          <p class="text-[12.5px] text-[var(--ink-400)] mt-0.5 leading-relaxed">
            {{ isEditMode ? 'Update the role name and description.' : 'Roles are fully dynamic — permissions are assigned after creation.' }}
          </p>
        </div>
        <button
          class="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-120 shrink-0 hover:border-[var(--ink-400)] hover:text-[var(--ink-700)] hover:bg-white active:scale-95"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" novalidate class="flex flex-col gap-4">
        <div>
          <label for="role-display-name" class="flex items-center gap-1 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Display Name <span class="text-red-500">*</span>
          </label>
          <input
            id="role-display-name"
            v-model="displayName"
            type="text"
            placeholder="e.g. Programme Manager"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-500': errors.display_name }"
            @input="handleDisplayNameInput"
          />
          <p v-if="errors.display_name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.display_name }}
          </p>
        </div>

        <div>
          <label for="role-name" class="flex items-center gap-1 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Machine Name <span class="text-red-500">*</span>
          </label>
          <input
            id="role-name"
            v-model="name"
            type="text"
            :disabled="isEditMode"
            placeholder="e.g. programme_manager"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-mono text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)] disabled:bg-[var(--bg)] disabled:text-[var(--ink-400)]"
            :class="{ '!border-red-500': errors.name }"
          />
          <p v-if="errors.name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.name }}
          </p>
          <p v-else class="mt-1.5 text-[11px] text-[var(--ink-400)]">Used internally and in API requests; cannot be changed later.</p>
        </div>

        <div>
          <label for="role-description" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Description
          </label>
          <textarea
            id="role-description"
            v-model="description"
            rows="2"
            placeholder="What this role is for…"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)] resize-none"
          />
        </div>

        <div class="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-[var(--line-soft)]">
          <button type="button" class="btn btn-secondary" :disabled="isSaving" @click="emit('close')">
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[12.5px] font-bold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_6px_16px_rgba(15,90,77,0.28)] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] hover:from-[var(--teal-600)] hover:to-[var(--teal-800)]"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Role' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
