<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User, UserRole, Role, CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { OrganisationOption } from '@/types/user'

// ─── Props / Emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  open: boolean
  editUser?: User | null
  isSaving: boolean
  organisations: OrganisationOption[]
  /** All roles an admin can assign — fully dynamic, fetched from /admin/roles. */
  roles: Role[]
  backendErrors?: Record<string, string[]> | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CreateUserPayload | UpdateUserPayload]
}>()

// ─── Role metadata for the visual role picker ────────────────────────────────
// Cosmetics only (icon/colour) for the three built-in roles; any other
// (admin-created) role falls back to a generic look — the role list itself
// always comes from the backend, never hardcoded here.

const BUILTIN_ROLE_META: Record<string, { icon: string; tile: string }> = {
  nep_admin: { icon: 'shield', tile: 'bg-indigo-100 text-indigo-700' },
  nep_coordinator: { icon: 'trend', tile: 'bg-amber-100 text-amber-700' },
  member_org: { icon: 'building', tile: 'bg-teal-100 text-teal-700' },
}
const DEFAULT_ROLE_META = { icon: 'users', tile: 'bg-slate-100 text-slate-600' }

function roleMeta(r: Role) {
  return BUILTIN_ROLE_META[r.name] ?? DEFAULT_ROLE_META
}

const roleOrder = computed(() => props.roles)

// ─── Form state ───────────────────────────────────────────────────────────────

const name = ref('')
const email = ref('')
const role = ref<UserRole>('')
const status = ref<'active' | 'inactive'>('active')
const organisationId = ref<number | null>(null)
const password = ref('')
const showPassword = ref(false)
const clientErrors = ref<Partial<Record<'name' | 'email' | 'role' | 'status' | 'password' | 'organisation_id', string>>>({})

const isEditMode = computed(() => !!props.editUser)
const title = computed(() => (isEditMode.value ? 'Edit User Account' : 'Create User Account'))
const subtitle = computed(() =>
  isEditMode.value ? 'Update the account details and role below.' : 'Set up the account and choose their role and organisation access.',
)
// ─── Combined errors helper ───────────────────────────────────────────────────

const errors = computed(() => {
  const errs: Record<string, string> = {}

  // Apply backend errors (422) first
  if (props.backendErrors) {
    Object.entries(props.backendErrors).forEach(([key, val]) => {
      if (Array.isArray(val) && val[0]) {
        errs[key] = val[0]
      }
    })
  }

  // Apply client validation errors which overwrite backend errors
  Object.entries(clientErrors.value).forEach(([key, val]) => {
    if (val) {
      errs[key] = val
    }
  })

  return errs
})
// The selected role's full record — drives whether the organisation field
// shows/is-required and whether this is a super-admin-level assignment.
const selectedRole = computed(() => props.roles.find((r) => r.name === role.value) ?? null)
const showOrganisationField = computed(() => !selectedRole.value?.is_super_admin)
// member_org keeps its original "must belong to an org" business rule; other
// roles (including custom ones) can optionally have an organisation.
const organisationRequired = computed(() => role.value === 'member_org')

function defaultRole(): string {
  return props.roles.find((r) => r.name === 'member_org')?.name ?? props.roles[0]?.name ?? ''
}

watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    resetForm()
    if (props.editUser) {
      name.value = props.editUser.name
      email.value = props.editUser.email
      role.value = props.editUser.role
      status.value = props.editUser.status
      organisationId.value = props.editUser.organisation_id
    }
  },
)
function resetForm() {
  name.value = ''
  email.value = ''
  role.value = defaultRole()
  status.value = 'active'
  organisationId.value = null
  password.value = ''
  showPassword.value = false
  clientErrors.value = {}
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(): boolean {
  clientErrors.value = {}

  if (!name.value.trim()) clientErrors.value.name = 'Full name is required.'
  if (!email.value.trim()) {
    clientErrors.value.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    clientErrors.value.email = 'Enter a valid email address.'
  }
  if (!role.value) clientErrors.value.role = 'Role is required.'
  if (!status.value) clientErrors.value.status = 'Status is required.'

  if (organisationRequired.value && !organisationId.value) {
    clientErrors.value.organisation_id = 'Organisation is required for member users.'
  }

  if (!isEditMode.value && password.value.trim() && password.value.length < 8) {
    clientErrors.value.password = 'Password must be at least 8 characters.'
  }

  return Object.keys(clientErrors.value).length === 0
}

// ─── Submit ───────────────────────────────────────────────────────────────────

function handleSubmit() {
  if (!validate()) return

  if (isEditMode.value) {
    const payload: UpdateUserPayload = {
      name: name.value.trim(),
      email: email.value.trim(),
      role: role.value,
      status: status.value,
      organisation_id: showOrganisationField.value ? organisationId.value : null,
    }
    emit('submit', payload)
  } else {
    const payload: CreateUserPayload = {
      name: name.value.trim(),
      email: email.value.trim(),
      role: role.value,
      password: password.value,
      organisation_id: showOrganisationField.value ? organisationId.value : null,
    }
    emit('submit', payload)
  }
}
</script>

<template>
  <BaseModal :open="open" :max-width="600" @close="emit('close')">
    <div class="w-full">
      <!-- Header -->
      <div class="flex items-start gap-3.5 mb-6">
        <div
          class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-[0_6px_16px_rgba(15,90,77,0.28)] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)]"
        >
          <BaseIcon :name="isEditMode ? 'edit' : 'plus'" :size="18" />
        </div>
        <div class="flex-1 min-w-0 pt-0.5">
          <h2 class="text-[17px] font-bold tracking-tight text-[var(--ink-900)]">{{ title }}</h2>
          <p class="text-[12.5px] text-[var(--ink-400)] mt-0.5 leading-relaxed">{{ subtitle }}</p>
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

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate class="flex flex-col gap-4">

        <!-- ── Section: Account details ── -->
        <div class="flex items-center gap-3">
          <span class="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)]">Account details</span>
          <span class="flex-1 h-px bg-[var(--line-soft)]" />
        </div>

        <!-- Full Name -->
        <div>
          <label for="um-name" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Full Name
          </label>
          <input
            id="um-name"
            v-model="name"
            type="text"
            placeholder="e.g. Jane Smith"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.12)]': errors.name }"
            autocomplete="name"
          />
          <p v-if="errors.name" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label for="um-email" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
            Email Address
          </label>
          <input
            id="um-email"
            v-model="email"
            type="email"
            placeholder="e.g. jane@example.com"
            class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
            :class="{ '!border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.12)]': errors.email }"
            autocomplete="email"
          />
          <p v-if="errors.email" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.email }}
          </p>
        </div>

        <!-- Password (create only) -->
        <Transition name="slide">
          <div v-if="!isEditMode">
            <label for="um-password" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
              Password
            </label>
            <div class="relative">
              <input
                id="um-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Min. 8 characters — leave blank to auto-generate"
                class="w-full border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 pr-11 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
                :class="{ '!border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.12)]': errors.password }"
                autocomplete="new-password"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md border-none bg-transparent flex items-center justify-center text-[var(--ink-400)] cursor-pointer transition-colors duration-120 hover:text-[var(--ink-700)]"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <BaseIcon :name="showPassword ? 'eye' : 'lock'" :size="14" />
              </button>
            </div>
            <p v-if="errors.password" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
              <BaseIcon name="alert" :size="11" />{{ errors.password }}
            </p>
          </div>
        </Transition>

        <!-- ── Section: Access & role ── -->
        <div class="flex items-center gap-3 mt-1">
          <span class="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)]">Access & role</span>
          <span class="flex-1 h-px bg-[var(--line-soft)]" />
        </div>

        <!-- Role picker (visual cards) -->
        <div>
          <label class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-2">
            Role
          </label>
          <div class="grid gap-2">
            <button
              v-for="r in roleOrder"
              :key="r.id"
              type="button"
              class="flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left cursor-pointer transition-all duration-150 group active:scale-[0.99]"
              :class="
                role === r.name
                  ? 'border-[var(--teal-600)] bg-[var(--teal-50)] shadow-[0_0_0_3px_var(--teal-100)]'
                  : 'border-[var(--line-soft)] bg-white hover:border-[var(--teal-400)] hover:shadow-sm'
              "
              :aria-pressed="role === r.name"
              @click="role = r.name"
            >
              <span
                class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105"
                :class="roleMeta(r).tile"
              >
                <BaseIcon :name="roleMeta(r).icon" :size="16" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[13px] font-bold text-[var(--ink-900)] leading-tight">
                  {{ r.display_name || r.name }}
                </span>
                <span class="block text-[11.5px] text-[var(--ink-400)] mt-0.5">{{ r.description || (r.is_super_admin ? 'Full system access' : '') }}</span>
              </span>
              <span
                class="w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                :class="role === r.name ? 'border-[var(--teal-600)] bg-[var(--teal-600)]' : 'border-[var(--line)] group-hover:border-[var(--teal-500)]'"
              >
                <BaseIcon v-if="role === r.name" name="check" :size="10" class="text-white" />
              </span>
            </button>
            <p v-if="roleOrder.length === 0" class="text-[12px] text-[var(--ink-400)] italic px-1">
              No roles available — create one under Roles first.
            </p>
          </div>
          <p v-if="errors.role" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
            <BaseIcon name="alert" :size="11" />{{ errors.role }}
          </p>
        </div>


        <!-- Status (edit only) -->
        <Transition name="slide">
          <div v-if="isEditMode">
            <label for="um-status" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
              Status
            </label>
            <div class="relative">
              <select
                id="um-status"
                v-model="status"
                class="w-full appearance-none border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 pr-9 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] cursor-pointer"
                :class="{ '!border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.12)]': errors.status }"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none">
                <BaseIcon name="chevronDown" :size="14" />
              </span>
            </div>
            <p v-if="errors.status" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
              <BaseIcon name="alert" :size="11" />{{ errors.status }}
            </p>
          </div>
        </Transition>

        <!-- Organisation (hidden only for super-admin-level roles) -->
        <Transition name="slide">
          <div v-if="showOrganisationField">
            <label for="um-organisation" class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">
              Organisation
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 uppercase tracking-wider">
                {{ organisationRequired ? 'Required' : 'Optional' }}
              </span>
            </label>
            <div class="relative">
              <select
                id="um-organisation"
                v-model="organisationId"
                class="w-full appearance-none border border-[var(--line)] rounded-[10px] px-3.5 py-2.5 pr-9 text-[13.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] cursor-pointer"
                :class="{ '!border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.12)]': errors.organisation_id }"
              >
                <option :value="null">Select organisation…</option>
                <option v-for="org in organisations" :key="org.id" :value="org.id">
                  {{ org.name }}
                </option>
              </select>
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none">
                <BaseIcon name="chevronDown" :size="14" />
              </span>
            </div>
            <p v-if="errors.organisation_id" class="flex items-center gap-1 mt-1.5 text-[11.5px] text-red-600">
              <BaseIcon name="alert" :size="11" />{{ errors.organisation_id }}
            </p>
          </div>
        </Transition>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2.5 mt-5 pt-4.5 border-t border-[var(--line-soft)]">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isSaving"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[12.5px] font-bold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_6px_16px_rgba(15,90,77,0.28)] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] hover:from-[var(--teal-600)] hover:to-[var(--teal-800)]"
            :disabled="isSaving"
          >
            <svg
              v-if="isSaving"
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
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create User' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

<style scoped>
/* ── Slide Transition ── */
.slide-enter-active {
  transition: all 0.2s ease;
}
.slide-leave-active {
  transition: all 0.15s ease;
}
.slide-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
