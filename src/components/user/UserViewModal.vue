<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User } from '@/types/user'

const props = defineProps<{
  open: boolean
  user: User | null
}>()

/**
 * Effective permissions to display: direct per-user overrides are
 * authoritative when present (mirrors User::hasPermission() on the
 * backend); otherwise show what the assigned role(s) grant.
 */
const effectivePermissions = computed(() => {
  if (!props.user) return []
  if (props.user.permissions && props.user.permissions.length > 0) {
    return props.user.permissions
  }
  const fromRoles = (props.user.roles ?? []).flatMap((r) => r.permissions ?? [])
  const seen = new Set<number>()
  return fromRoles.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
})

const permissionsAreDirectOverride = computed(() => (props.user?.permissions?.length ?? 0) > 0)

const emit = defineEmits<{
  close: []
}>()

const ROLE_LABELS: Record<string, string> = {
  nep_admin: 'NEP Admin',
  nep_coordinator: 'Coordinator',
  member_org: 'Member Organisation',
}

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  nep_admin: { bg: '#eef0fb', text: '#4338ca', dot: '#6366f1' },
  nep_coordinator: { bg: '#fef3e2', text: '#b45309', dot: '#f59e0b' },
  member_org: { bg: '#e7f5f3', text: '#0f5c56', dot: '#14b8a6' },
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <BaseModal :open="open" :max-width="500" @close="emit('close')">
    <div class="w-full">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 class="text-base font-bold text-[var(--ink-900)]">User Details</h2>
          <p class="text-xs text-[var(--ink-400)] mt-0.5">Read-only account information</p>
        </div>
        <button
          class="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-120 shrink-0 hover:border-[var(--ink-400)] hover:text-[var(--ink-700)]"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <div v-if="user" class="space-y-4 sm:space-y-5">
        <!-- Profile Header Card -->
        <div class="rounded-xl bg-white border border-[var(--line-soft)] shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5">
            <div class="flex items-center gap-3.5 sm:gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-[0_3px_8px_rgba(10,61,57,0.2)]"
              >
                {{ initials(user.name) }}
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-bold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis leading-snug">{{ user.name }}</h3>
                <p class="mt-0.5 text-xs text-[var(--ink-400)] whitespace-nowrap overflow-hidden text-ellipsis">{{ user.email }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Rows Card -->
        <div class="rounded-xl bg-white border border-[var(--line-soft)] shadow-sm overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-[var(--line-soft)]">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)]">Account Details</h4>
          </div>
          <div class="px-4 sm:px-5 py-1 divide-y divide-[var(--line-soft)]">
            <!-- Role -->
            <div class="flex items-center justify-between gap-4 py-3.5">
              <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)] shrink-0 min-w-[100px]">
                <BaseIcon name="shield" :size="14" />
                Role
              </span>
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-bold shrink-0"
                :style="{
                  background: ROLE_COLORS[user.role]?.bg ?? '#f3f4f6',
                  color: ROLE_COLORS[user.role]?.text ?? '#6b7280',
                }"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :style="{ background: ROLE_COLORS[user.role]?.dot ?? '#9ca3af' }"
                />
                {{ ROLE_LABELS[user.role] ?? user.role }}
              </span>
            </div>

            <!-- Status -->
            <div class="flex items-center justify-between gap-4 py-3.5">
              <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)] shrink-0 min-w-[100px]">
                <BaseIcon name="bolt" :size="14" />
                Status
              </span>
              <span
                class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold shrink-0"
                :class="user.status === 'active' ? 'text-[var(--green-700)]' : 'text-[var(--ink-400)]'"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="user.status === 'active' ? 'bg-[var(--green-700)] shadow-[0_0_0_3px_var(--green-100)]' : 'bg-[var(--ink-400)] shadow-[0_0_0_3px_var(--line-soft)]'"
                />
                {{ user.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <!-- Organisation -->
            <div class="flex items-start sm:items-center justify-between gap-4 sm:gap-6 py-3.5">
              <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)] shrink-0 min-w-[100px] mt-0.5 sm:mt-0">
                <BaseIcon name="building" :size="14" />
                Organisation
              </span>
              <span class="text-xs sm:text-sm font-medium text-[var(--ink-900)] text-right flex-1 min-w-0 break-words leading-relaxed">
                {{ user.organisation?.name || 'None' }}
              </span>
            </div>

            <!-- Created -->
            <div class="flex items-start sm:items-center justify-between gap-4 sm:gap-6 py-3.5">
              <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)] shrink-0 min-w-[100px] mt-0.5 sm:mt-0">
                <BaseIcon name="upload" :size="14" />
                Created
              </span>
              <span class="text-xs sm:text-sm font-medium text-[var(--ink-900)] text-right flex-1 min-w-0 break-words leading-relaxed">
                {{ formatDate(user.created_at) }}
              </span>
            </div>

            <!-- Last Updated -->
            <div class="flex items-start sm:items-center justify-between gap-4 sm:gap-6 py-3.5 last:border-b-0">
              <span class="flex items-center gap-2 text-xs font-semibold text-[var(--ink-400)] shrink-0 min-w-[100px] mt-0.5 sm:mt-0">
                <BaseIcon name="refresh" :size="14" />
                Last Updated
              </span>
              <span class="text-xs sm:text-sm font-medium text-[var(--ink-900)] text-right flex-1 min-w-0 break-words leading-relaxed">
                {{ formatDate(user.updated_at) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Effective Permissions -->
        <div class="rounded-xl bg-white border border-[var(--line-soft)] shadow-sm overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-[var(--line-soft)] flex items-center justify-between gap-2">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)]">
              {{ permissionsAreDirectOverride ? 'Individually Assigned Permissions' : 'Permissions (from role)' }}
            </h4>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--ink-500)] border border-[var(--line-soft)]">
              {{ effectivePermissions.length }}
            </span>
          </div>
          <div v-if="effectivePermissions.length > 0" class="p-4 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            <span
              v-for="perm in effectivePermissions"
              :key="perm.id"
              class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-[var(--bg)] border border-[var(--line-soft)] text-[var(--ink-600)]"
              :title="perm.description || perm.name"
            >
              {{ perm.display_name || perm.name }}
            </span>
          </div>
          <p v-else class="px-5 py-4 text-xs text-[var(--ink-400)]">No permissions assigned.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end mt-5 pt-4 border-t border-[var(--line-soft)]">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
  </BaseModal>
</template>