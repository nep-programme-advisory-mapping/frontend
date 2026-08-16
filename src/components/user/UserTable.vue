<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import UserStatusBadge from './UserStatusBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { usePermission } from '@/composables/usePermission'
import type { User } from '@/types/user'

defineProps<{
  users: User[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  view: [user: User]
  edit: [user: User]
  deactivate: [user: User]
  reactivate: [user: User]
  resetCredentials: [user: User]
  remove: [user: User]
}>()

const { hasPermission } = usePermission()

/** Human-readable role labels */
const ROLE_LABELS: Record<string, string> = {
  nep_admin: 'Admin',
  nep_coordinator: 'Coordinator',
  member_org: 'Member',
}

/** Role → colour tokens */
const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  nep_admin: { bg: '#eef0fb', text: '#4338ca', dot: '#6366f1' },
  nep_coordinator: { bg: '#fef3e2', text: '#b45309', dot: '#f59e0b' },
  member_org: { bg: '#e7f5f3', text: '#0f5c56', dot: '#14b8a6' },
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function roleColor(role: string) {
  return ROLE_COLORS[role] ?? { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' }
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden">
    <!-- ─── Loading Skeletons ─── -->
    <div v-if="isLoading" class="py-1">
      <div v-for="n in 6" :key="n" class="flex items-center gap-3.5 px-5 py-3.5 border-b border-[var(--line-soft)] last:border-b-0">
        <div class="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
        <div class="flex flex-col gap-1.5 flex-1">
          <div class="h-2.5 rounded bg-gray-100 animate-pulse w-36" />
          <div class="h-2 rounded bg-gray-100 animate-pulse w-48 opacity-60" />
        </div>
        <div class="w-16 h-6 rounded-full bg-gray-100 animate-pulse" />
        <div class="w-[52px] h-6 rounded-full bg-gray-100 animate-pulse" />
        <div class="h-2.5 rounded bg-gray-100 animate-pulse w-28 hidden md:block" />
        <div class="h-2.5 rounded bg-gray-100 animate-pulse w-24 hidden md:block" />
        <div class="flex gap-1.5 ml-auto">
          <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
          <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- ─── Empty State ─── -->
    <EmptyState
      v-else-if="users.length === 0"
      icon="users"
      title="No users found"
      message="Try adjusting your search or create a new user."
    />

    <!-- ─── Desktop Table ─── -->
    <template v-else>
      <table class="w-full border-collapse table-fixed hidden md:table">
        <thead>
          <tr class="border-b border-[var(--line)]">
            <th class="w-[28%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">User</th>
            <th class="w-[13%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Role</th>
            <th class="w-[11%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Status</th>
            <th class="w-[18%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Organisation</th>
            <th class="w-[14%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Created</th>
            <th class="w-[16%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] whitespace-nowrap bg-[var(--bg)] text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b border-[var(--line-soft)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--teal-50)]">
            <!-- Avatar + Name + Email -->
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-xs font-bold tracking-wide shrink-0 shadow-[0_2px_6px_rgba(10,61,57,0.18)]">
                  {{ initials(user.name) }}
                </div>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-[13.5px] font-semibold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis">{{ user.name }}</span>
                  <span class="text-xs text-[var(--ink-400)] whitespace-nowrap overflow-hidden text-ellipsis">{{ user.email }}</span>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold tracking-normal whitespace-nowrap"
                :style="{
                  background: roleColor(user.role).bg,
                  color: roleColor(user.role).text,
                }"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :style="{ background: roleColor(user.role).dot }"
                />
                {{ roleLabel(user.role) }}
              </span>
            </td>

            <!-- Status -->
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <UserStatusBadge :status="user.status" />
            </td>

            <!-- Organisation -->
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle">
              <span v-if="user.organisation" class="text-[12.5px] text-[var(--ink-700)] whitespace-nowrap overflow-hidden text-ellipsis block">
                {{ user.organisation.name }}
              </span>
              <span v-else class="text-[12.5px] text-[var(--ink-300)]">—</span>
            </td>

            <!-- Created -->
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle text-[12.5px] text-[var(--ink-400)] whitespace-nowrap">
              {{ formatDate(user.created_at) }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-3.5 text-[13px] text-[var(--ink-700)] align-middle text-right">
              <div class="inline-flex items-center gap-1">
                <button class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]" title="View details" @click="emit('view', user)">
                  <BaseIcon name="eye" :size="14" />
                </button>
                <button
                  v-if="hasPermission('users.update')"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                  title="Edit user"
                  @click="emit('edit', user)"
                >
                  <BaseIcon name="edit" :size="14" />
                </button>
                <button
                  v-if="hasPermission('users.update') && user.status === 'active'"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
                  title="Deactivate account"
                  @click="emit('deactivate', user)"
                >
                  <BaseIcon name="ban" :size="14" />
                </button>
                <button
                  v-else-if="hasPermission('users.update')"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                  title="Reactivate account"
                  @click="emit('reactivate', user)"
                >
                  <BaseIcon name="refresh" :size="14" />
                </button>
                <button
                  v-if="hasPermission('users.delete')"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
                  title="Delete account"
                  @click="emit('remove', user)"
                >
                  <BaseIcon name="trash" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ─── Mobile Cards (< 768px) ─── -->
      <div class="flex flex-col md:hidden">
        <div v-for="user in users" :key="user.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
          <div class="flex items-center gap-2.5">
            <div class="w-[34px] h-[34px] rounded-[9px] text-[11px] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white font-bold tracking-wide shrink-0 shadow-[0_2px_6px_rgba(10,61,57,0.18)]">{{ initials(user.name) }}</div>
            <div class="flex flex-col gap-0.5 min-w-0 flex-1">
              <span class="text-[13.5px] font-semibold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis">{{ user.name }}</span>
              <span class="text-xs text-[var(--ink-400)] whitespace-nowrap overflow-hidden text-ellipsis">{{ user.email }}</span>
            </div>
            <UserStatusBadge :status="user.status" />
          </div>
          <div class="flex items-center flex-wrap gap-2 mt-2.5 pl-11">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold tracking-normal whitespace-nowrap"
              :style="{
                background: roleColor(user.role).bg,
                color: roleColor(user.role).text,
              }"
            >
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: roleColor(user.role).dot }" />
              {{ roleLabel(user.role) }}
            </span>
            <span v-if="user.organisation" class="text-xs text-[var(--ink-600)]">{{ user.organisation.name }}</span>
            <span class="text-xs text-[var(--ink-400)]">{{ formatDate(user.created_at) }}</span>
          </div>
          <div class="flex gap-1.5 mt-3 pl-11 flex-wrap">
            <button class="btn btn-secondary btn-sm" @click="emit('view', user)">
              <BaseIcon name="eye" :size="13" /> View
            </button>
            <button v-if="hasPermission('users.update')" class="btn btn-secondary btn-sm" @click="emit('edit', user)">
              <BaseIcon name="edit" :size="13" /> Edit
            </button>
            <button
              v-if="hasPermission('users.update') && user.status === 'active'"
              class="btn btn-danger-ghost btn-sm"
              @click="emit('deactivate', user)"
            >
              <BaseIcon name="ban" :size="13" /> Deactivate
            </button>
            <button
              v-else-if="hasPermission('users.update')"
              class="btn btn-secondary btn-sm"
              @click="emit('reactivate', user)"
            >
              <BaseIcon name="refresh" :size="13" /> Reactivate
            </button>
            <button
              v-if="hasPermission('users.delete')"
              class="btn btn-danger-ghost btn-sm"
              @click="emit('remove', user)"
            >
              <BaseIcon name="trash" :size="13" /> Delete
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
