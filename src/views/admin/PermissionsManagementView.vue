<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ToastHost from '@/components/ToastHost.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import PermissionFormModal from '@/components/user/PermissionFormModal.vue'
import { usePermission } from '@/composables/usePermission'
import { useRolesAdminStore } from '@/stores/rolesAdmin'
import type { Permission } from '@/types/user'

const { hasPermission } = usePermission()
const router = useRouter()
const store = useRolesAdminStore()

onMounted(async () => {
  if (!hasPermission('permissions.view')) {
    router.replace({ name: 'forbidden' })
    return
  }
  await store.fetchAll()
})

const search = ref('')

const groups = computed(() => {
  const q = search.value.trim().toLowerCase()
  const filtered = q
    ? store.allPermissions.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.group.toLowerCase().includes(q),
      )
    : store.allPermissions

  const byGroup = new Map<string, Permission[]>()
  for (const perm of filtered) {
    if (!byGroup.has(perm.group)) byGroup.set(perm.group, [])
    byGroup.get(perm.group)!.push(perm)
  }
  return [...byGroup.entries()].sort(([a], [b]) => a.localeCompare(b))
})

const existingGroups = computed(() => [...new Set(store.allPermissions.map((p) => p.group))].sort())

// ─── Create / edit / delete ───────────────────────────────────────────────

const showForm = ref(false)
const editingPermission = ref<Permission | null>(null)
const deleteCandidate = ref<Permission | null>(null)

function openCreate() {
  editingPermission.value = null
  showForm.value = true
}

function openEdit(permission: Permission) {
  editingPermission.value = permission
  showForm.value = true
}

async function handleSubmit(payload: { name?: string; display_name: string; group: string; description: string | null }) {
  const ok = editingPermission.value
    ? await store.updatePermission(editingPermission.value, payload)
    : await store.createPermission(payload as { name: string; display_name: string; group: string; description: string | null })
  if (ok) showForm.value = false
}

async function confirmDelete() {
  if (!deleteCandidate.value) return
  const ok = await store.deletePermission(deleteCandidate.value)
  if (ok) deleteCandidate.value = null
}
</script>

<template>
  <AppShell>
    <PageHeader
      title="Permissions"
      subtitle="Define the fine-grained abilities roles and users can be granted."
    >
      <button
        v-if="hasPermission('permissions.create')"
        type="button"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        @click="openCreate"
      >
        <BaseIcon name="plus" :size="15" />
        New Permission
      </button>
    </PageHeader>

    <div class="relative mb-4 max-w-[360px]">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none flex">
        <BaseIcon name="search" :size="14" />
      </span>
      <input
        v-model="search"
        type="text"
        placeholder="Search permissions…"
        class="w-full border border-[var(--line)] rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-[var(--ink-900)] bg-[var(--card)] transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)] placeholder:text-[var(--ink-300)]"
      />
    </div>

    <div v-if="store.isLoading" class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-[13px] text-[var(--ink-500)]">
      Loading permissions…
    </div>

    <div v-else-if="groups.length === 0" class="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-8 text-center text-[13px] text-[var(--ink-400)]">
      No permissions match your search.
    </div>

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="[group, perms] in groups"
        :key="group"
        class="rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-sm overflow-hidden"
      >
        <div class="px-5 py-3 border-b border-[var(--line-soft)] bg-[var(--bg)]">
          <h3 class="text-[12.5px] font-bold uppercase tracking-wide text-[var(--ink-700)]">{{ group }}</h3>
        </div>
        <div class="divide-y divide-[var(--line-soft)]">
          <div
            v-for="perm in perms"
            :key="perm.id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[13px] font-semibold text-[var(--ink-900)]">{{ perm.display_name }}</span>
                <code class="text-[10.5px] bg-[var(--bg)] border border-[var(--line-soft)] px-1.5 py-0.5 rounded text-[var(--ink-500)]">{{ perm.name }}</code>
              </div>
              <p v-if="perm.description" class="text-[11.5px] text-[var(--ink-400)] mt-0.5 truncate">{{ perm.description }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="hasPermission('permissions.update')"
                type="button"
                class="w-8 h-8 rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                title="Edit permission"
                @click="openEdit(perm)"
              >
                <BaseIcon name="edit" :size="14" />
              </button>
              <button
                v-if="hasPermission('permissions.delete')"
                type="button"
                class="w-8 h-8 rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50"
                title="Delete permission"
                @click="deleteCandidate = perm"
              >
                <BaseIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PermissionFormModal
      :open="showForm"
      :edit-permission="editingPermission"
      :existing-groups="existingGroups"
      :is-saving="store.isMutatingPermission"
      @close="showForm = false"
      @submit="handleSubmit"
    />

    <ConfirmDialog
      :open="!!deleteCandidate"
      title="Delete Permission"
      :message="`Delete '${deleteCandidate?.display_name}'? Any role currently granting it will lose this ability immediately.`"
      confirm-label="Delete Permission"
      danger
      :loading="store.isMutatingPermission"
      @confirm="confirmDelete"
      @cancel="deleteCandidate = null"
    />

    <ToastHost />
  </AppShell>
</template>
