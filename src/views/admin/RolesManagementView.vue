<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ToastHost from '@/components/ToastHost.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import RoleFormModal from '@/components/user/RoleFormModal.vue'
import { usePermission } from '@/composables/usePermission'
import { useRolesAdminStore } from '@/stores/rolesAdmin'
import type { Role } from '@/types/user'

const { hasPermission } = usePermission()
const router = useRouter()
const store = useRolesAdminStore()

onMounted(async () => {
  if (!hasPermission('roles.view')) {
    router.replace({ name: 'forbidden' })
    return
  }
  await store.fetchAll()
})

// ─── Role create / edit / delete ─────────────────────────────────────────────

const showRoleForm = ref(false)
const editingRole = ref<Role | null>(null)
const deleteCandidate = ref<Role | null>(null)

function openCreateRole() {
  editingRole.value = null
  showRoleForm.value = true
}

function openEditRole(role: Role) {
  editingRole.value = role
  showRoleForm.value = true
}

async function handleRoleFormSubmit(payload: { name?: string; display_name: string; description: string | null }) {
  const ok = editingRole.value
    ? await store.updateRoleDetails(editingRole.value, payload)
    : await store.createRole(payload as { name: string; display_name: string; description: string | null })
  if (ok) showRoleForm.value = false
}

function requestDeleteRole(role: Role) {
  deleteCandidate.value = role
}

async function confirmDeleteRole() {
  if (!deleteCandidate.value) return
  const ok = await store.deleteRole(deleteCandidate.value)
  if (ok) deleteCandidate.value = null
}

function canDeleteRole(role: Role): boolean {
  return role.name !== 'nep_admin' && (role.users_count ?? 0) === 0
}

function deleteBlockedReason(role: Role): string {
  if (role.name === 'nep_admin') return 'The NEP Administrator role cannot be deleted.'
  if ((role.users_count ?? 0) > 0) return `Reassign the ${role.users_count} user(s) on this role before deleting it.`
  return ''
}

// ─── Per-role editor state ────────────────────────────────────────────────────

const expandedRoleId = ref<number | null>(null)
const drafts = ref<Record<number, number[]>>({})
const searches = ref<Record<number, string>>({})

const ROLE_META: Record<string, { icon: string; tile: string }> = {
  nep_admin: { icon: 'shield', tile: 'bg-indigo-100 text-indigo-700' },
  nep_coordinator: { icon: 'trend', tile: 'bg-amber-100 text-amber-700' },
  member_org: { icon: 'building', tile: 'bg-teal-100 text-teal-700' },
}
const DEFAULT_META = { icon: 'users', tile: 'bg-slate-100 text-slate-600' }

function roleMeta(role: Role) {
  return ROLE_META[role.name] ?? DEFAULT_META
}

function rolePermissionIds(role: Role): number[] {
  return (role.permissions ?? []).map((p) => p.id)
}

function isExpanded(roleId: number): boolean {
  return expandedRoleId.value === roleId
}

function toggleExpand(role: Role) {
  if (expandedRoleId.value === role.id) {
    expandedRoleId.value = null
    return
  }
  expandedRoleId.value = role.id
  drafts.value[role.id] = [...rolePermissionIds(role)]
  searches.value[role.id] = ''
}

function draftFor(role: Role): number[] {
  return drafts.value[role.id] ?? rolePermissionIds(role)
}

const filteredPermissions = computed(() => {
  const role = store.roles.find((r) => r.id === expandedRoleId.value)
  if (!role) return []
  const q = (searches.value[role.id] ?? '').trim().toLowerCase()
  if (!q) return store.allPermissions
  return store.allPermissions.filter(
    (p) =>
      p.display_name.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q),
  )
})

const expandedRole = computed(() => store.roles.find((r) => r.id === expandedRoleId.value) ?? null)

const draftCount = computed(() => (expandedRole.value ? draftFor(expandedRole.value).length : 0))

const draftPercent = computed(() => {
  const total = store.allPermissions.length
  return total ? Math.round((draftCount.value / total) * 100) : 0
})

const allDraftSelected = computed(
  () => store.allPermissions.length > 0 && draftCount.value === store.allPermissions.length,
)

function isDraftSelected(permId: number): boolean {
  if (!expandedRole.value) return false
  return draftFor(expandedRole.value).includes(permId)
}

function toggleDraft(permId: number) {
  if (!expandedRole.value) return
  const current = draftFor(expandedRole.value)
  drafts.value[expandedRole.value.id] = current.includes(permId)
    ? current.filter((id) => id !== permId)
    : [...current, permId]
}

function toggleAllDraft() {
  if (!expandedRole.value) return
  const all = store.allPermissions.map((p) => p.id)
  drafts.value[expandedRole.value.id] = allDraftSelected.value ? [] : [...all]
}

async function saveExpandedRole() {
  if (!expandedRole.value) return
  const ok = await store.savePermissions(expandedRole.value, draftFor(expandedRole.value))
  if (ok) {
    expandedRoleId.value = null
    delete drafts.value[expandedRole.value.id]
    delete searches.value[expandedRole.value.id]
  }
}

function cancelExpandedRole() {
  if (!expandedRole.value) return
  delete drafts.value[expandedRole.value.id]
  delete searches.value[expandedRole.value.id]
  expandedRoleId.value = null
}
</script>

<template>
  <AppShell>
    <PageHeader
      title="Roles & Permissions"
      subtitle="Manage the abilities granted to each role in the system."
    >
      <button
        v-if="hasPermission('roles.create')"
        type="button"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        @click="openCreateRole"
      >
        <BaseIcon name="plus" :size="15" />
        New Role
      </button>
    </PageHeader>

    <!-- Loading -->
    <div
      v-if="store.isLoading"
      class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-[13px] text-[var(--ink-500)]"
    >
      Loading roles and permissions…
    </div>

    <!-- Roles list -->
    <div v-else class="flex flex-col gap-3.5">
      <div
        v-for="role in store.roles"
        :key="role.id"
        class="rounded-2xl bg-[var(--card)] border transition-all duration-200 overflow-hidden"
        :class="isExpanded(role.id) ? 'border-[var(--teal-600)] shadow-[0_0_0_3px_var(--teal-100)]' : 'border-[var(--line)] shadow-sm hover:shadow-md'"
      >
        <!-- Card header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4">
          <!-- Role branding & info -->
          <div class="flex items-center gap-3.5 min-w-0 flex-1">
            <span
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150"
              :class="roleMeta(role).tile"
            >
              <BaseIcon :name="roleMeta(role).icon" :size="17" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-bold text-[var(--ink-900)] leading-tight">{{ role.display_name || role.name }}</h3>
                <span
                  v-if="role.is_system"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                >
                  System
                </span>
              </div>
              <p class="text-xs text-[var(--ink-400)] mt-0.5 truncate">{{ role.description || role.name }}</p>
            </div>
          </div>

          <!-- Role stats & action buttons -->
          <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[var(--line-soft)]">
            <span class="hidden sm:inline text-[11px] font-medium text-[var(--ink-400)] whitespace-nowrap mr-1">
              {{ rolePermissionIds(role).length }} abilities · {{ role.users_count ?? 0 }} users
            </span>
            <!-- On mobile show compact stats -->
            <span class="sm:hidden text-[11px] font-medium text-[var(--ink-400)] whitespace-nowrap">
              {{ rolePermissionIds(role).length }} / {{ role.users_count ?? 0 }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="hasPermission('roles.update')"
                type="button"
                class="w-8 h-8 rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                title="Edit role details"
                @click="openEditRole(role)"
              >
                <BaseIcon name="edit" :size="14" />
              </button>
              <button
                v-if="hasPermission('roles.delete')"
                type="button"
                class="w-8 h-8 rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                :class="canDeleteRole(role) ? 'text-[var(--ink-500)] hover:border-red-600 hover:text-red-600 hover:bg-red-50' : 'text-[var(--ink-300)]'"
                :disabled="!canDeleteRole(role)"
                :title="canDeleteRole(role) ? 'Delete role' : deleteBlockedReason(role)"
                @click="canDeleteRole(role) && requestDeleteRole(role)"
              >
                <BaseIcon name="trash" :size="14" />
              </button>
              <button
                v-if="hasPermission('roles.update')"
                type="button"
                class="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11.5px] font-bold transition-all duration-150 cursor-pointer active:scale-[0.97]"
                :class="
                  isExpanded(role.id)
                    ? 'border-[var(--teal-600)] bg-[var(--teal-50)] text-[var(--teal-700)]'
                    : 'border-[var(--line)] bg-white text-[var(--ink-600)] hover:border-[var(--teal-500)] hover:text-[var(--teal-700)]'
                "
                @click="toggleExpand(role)"
              >
                {{ isExpanded(role.id) ? 'Close' : 'Edit permissions' }}
                <BaseIcon
                  name="chevronDown"
                  :size="12"
                  class="transition-transform duration-200"
                  :class="isExpanded(role.id) ? 'rotate-180' : ''"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Permission editor (expanded) -->
        <Transition name="expand">
          <div v-if="isExpanded(role.id)" class="border-t border-[var(--line-soft)] bg-[var(--bg)] px-4 sm:px-5 pt-4 pb-5">
            <!-- Editor header: count + progress + select all -->
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="text-[12.5px] font-semibold text-[var(--ink-700)] shrink-0">Permissions</span>
                <div class="flex-1 h-1 rounded-full bg-[var(--line-soft)] overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="draftPercent === 100 ? 'bg-[var(--teal-600)]' : 'bg-gradient-to-r from-[var(--teal-700)] to-[var(--teal-400)]'"
                    :style="{ width: draftPercent + '%' }"
                  />
                </div>
                <span class="text-[11px] font-medium text-[var(--ink-400)] whitespace-nowrap tabular-nums shrink-0">
                  {{ draftCount }} / {{ store.allPermissions.length }}
                </span>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--teal-700)] cursor-pointer transition-colors duration-120 hover:text-[var(--teal-800)] shrink-0"
                @click="toggleAllDraft"
              >
                <BaseIcon :name="allDraftSelected ? 'x' : 'check'" :size="11" />
                {{ allDraftSelected ? 'Clear all' : 'Select all' }}
              </button>
            </div>

            <!-- Search -->
            <div class="relative mb-2.5">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none flex">
                <BaseIcon name="search" :size="13" />
              </span>
              <input
                v-model="searches[role.id]"
                type="text"
                placeholder="Search abilities…"
                class="w-full border border-[var(--line)] rounded-[10px] py-2 pl-9 pr-3.5 text-[12.5px] font-inherit text-[var(--ink-900)] bg-white transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)] placeholder:text-[var(--ink-300)]"
              />
            </div>

            <!-- Flat permission checklist -->
            <div class="max-h-60 overflow-y-auto rounded-[12px] border border-[var(--line-soft)] bg-white divide-y divide-[var(--line-soft)]">
              <label
                v-for="perm in filteredPermissions"
                :key="perm.id"
                role="checkbox"
                tabindex="0"
                :aria-checked="isDraftSelected(perm.id)"
                class="flex items-center gap-3 px-3.5 py-2 cursor-pointer transition-colors duration-120 group select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal-400)] focus-visible:ring-offset-1 rounded-[4px]"
                :class="isDraftSelected(perm.id) ? 'bg-[var(--teal-50)]/70' : 'hover:bg-[var(--bg)]'"
                @click="toggleDraft(perm.id)"
                @keydown.enter.prevent="toggleDraft(perm.id)"
                @keydown.space.prevent="toggleDraft(perm.id)"
              >
                <span
                  class="w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-150"
                  :class="
                    isDraftSelected(perm.id)
                      ? 'bg-[var(--teal-700)] border-[var(--teal-700)] shadow-[0_1px_4px_rgba(15,90,77,0.35)]'
                      : 'bg-white border-[var(--line)] group-hover:border-[var(--teal-500)]'
                  "
                >
                  <svg
                    v-if="isDraftSelected(perm.id)"
                    class="w-3 h-3 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[12.5px] font-medium text-[var(--ink-800)] leading-tight">
                    {{ perm.display_name }}
                  </span>
                  <span class="block text-[10.5px] text-[var(--ink-400)] truncate">
                    {{ perm.description || perm.name }}
                  </span>
                </span>
              </label>
              <div v-if="filteredPermissions.length === 0" class="p-4 text-[12px] text-[var(--ink-400)]">
                No abilities match your search.
              </div>
            </div>

            <p v-if="role.is_super_admin" class="mt-2 text-[10.5px] text-indigo-600 flex items-center gap-1.5">
              <BaseIcon name="info" :size="12" />
              Super admin role — holds every permission implicitly and stays synced automatically as new permissions are added.
            </p>

            <!-- Editor footer -->
            <div class="flex justify-end gap-2.5 mt-4 pt-3.5 border-t border-[var(--line-soft)]">
              <button type="button" class="btn btn-secondary" :disabled="store.savingRoleId !== null" @click="cancelExpandedRole">
                Cancel
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12.5px] font-bold text-white transition-all duration-150 cursor-pointer active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                :class="store.savingRoleId === role.id ? 'bg-[var(--teal-600)]' : 'bg-gradient-to-r from-[var(--teal-700)] to-[var(--teal-600)] shadow-[0_4px_12px_rgba(15,90,77,0.25)] hover:shadow-[0_6px_16px_rgba(15,90,77,0.35)]'"
                :disabled="store.savingRoleId !== null || draftCount === rolePermissionIds(role).length"
                @click="saveExpandedRole"
              >
                <svg
                  v-if="store.savingRoleId === role.id"
                  class="animate-spin w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span v-if="store.savingRoleId === role.id">Saving…</span>
                <span v-else>Save changes</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <RoleFormModal
      :open="showRoleForm"
      :edit-role="editingRole"
      :is-saving="store.isMutatingRole"
      @close="showRoleForm = false"
      @submit="handleRoleFormSubmit"
    />

    <ConfirmDialog
      :open="!!deleteCandidate"
      title="Delete Role"
      :message="`Delete the '${deleteCandidate?.display_name || deleteCandidate?.name}' role? This cannot be undone.`"
      confirm-label="Delete Role"
      danger
      :loading="store.isMutatingRole"
      @confirm="confirmDeleteRole"
      @cancel="deleteCandidate = null"
    />

    <ToastHost />
  </AppShell>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.22s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
