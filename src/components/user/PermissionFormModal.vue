<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Permission } from '@/types/user'

const props = defineProps<{
  open: boolean
  editPermission?: Permission | null
  existingGroups: string[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { name?: string; display_name: string; group: string; description: string | null }]
}>()

const name = ref('')
const displayName = ref('')
const group = ref('')
const description = ref('')
const errors = ref<Partial<Record<'name' | 'display_name' | 'group', string>>>({})

const isEditMode = computed(() => !!props.editPermission)
const title = computed(() => (isEditMode.value ? 'Edit Permission' : 'Create Permission'))

watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    errors.value = {}
    if (props.editPermission) {
      name.value = props.editPermission.name
      displayName.value = props.editPermission.display_name
      group.value = props.editPermission.group
      description.value = props.editPermission.description ?? ''
    } else {
      name.value = ''
      displayName.value = ''
      group.value = ''
      description.value = ''
    }
  },
)

function validate(): boolean {
  errors.value = {}
  if (!displayName.value.trim()) errors.value.display_name = 'Display name is required.'
  if (!group.value.trim()) errors.value.group = 'Module/group is required.'
  if (!isEditMode.value) {
    if (!name.value.trim()) {
      errors.value.name = 'Permission key is required.'
    } else if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(name.value.trim())) {
      errors.value.name = 'Use the resource.action convention, e.g. reports.export.'
    }
  }
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  if (isEditMode.value) {
    emit('submit', {
      display_name: displayName.value.trim(),
      group: group.value.trim(),
      description: description.value.trim() || null,
    })
  } else {
    emit('submit', {
      name: name.value.trim(),
      display_name: displayName.value.trim(),
      group: group.value.trim(),
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
            Permissions follow a <code class="text-[11px] bg-[var(--bg)] px-1 py-0.5 rounded">resource.action</code> naming convention and are grouped by module.
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
          <label for="perm-display-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Display Name
          </label>
          <input
            id="perm-display-name"
            v-model="displayName"
            type="text"
            placeholder="e.g. Export Reports"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-500': errors.display_name }"
          />
          <p v-if="errors.display_name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.display_name }}
          </p>
        </div>

        <div>
          <label for="perm-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Permission Key
          </label>
          <input
            id="perm-name"
            v-model="name"
            type="text"
            :disabled="isEditMode"
            placeholder="e.g. reports.export"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-mono text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)] disabled:bg-[var(--bg)] disabled:text-[var(--ink-400)]"
            :class="{ '!border-red-500': errors.name }"
          />
          <p v-if="errors.name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.name }}
          </p>
          <p v-else class="mt-1.5 text-[11px] text-[var(--ink-400)]">This is what routes/middleware check — cannot be changed later.</p>
        </div>

        <div>
          <label for="perm-group" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Module / Group
          </label>
          <input
            id="perm-group"
            v-model="group"
            type="text"
            list="perm-group-options"
            placeholder="e.g. Reports"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-500': errors.group }"
          />
          <datalist id="perm-group-options">
            <option v-for="g in existingGroups" :key="g" :value="g" />
          </datalist>
          <p v-if="errors.group" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.group }}
          </p>
        </div>

        <div>
          <label for="perm-description" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Description
          </label>
          <textarea
            id="perm-description"
            v-model="description"
            rows="2"
            placeholder="What this permission allows…"
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
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Permission' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
