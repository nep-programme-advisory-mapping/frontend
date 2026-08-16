<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import type { Organisation } from '@/types/organisations'

defineProps<{
  organisations: Organisation[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  edit: [org: Organisation]
  deactivate: [org: Organisation]
  activate: [org: Organisation]
}>()

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function logoSrc(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : null
}
</script>

<template>
  <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden">

    <!-- Loading Skeletons -->
    <div v-if="isLoading" class="py-1">
      <div v-for="n in 6" :key="n" class="flex items-center gap-3.5 px-5 py-3.5 border-b border-[var(--line-soft)] last:border-b-0">
        <div class="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
        <div class="flex flex-col gap-1.5 flex-1">
          <div class="h-2.5 rounded bg-gray-100 animate-pulse w-36" />
          <div class="h-2 rounded bg-gray-100 animate-pulse w-48 opacity-60" />
        </div>
        <div class="w-16 h-6 rounded-full bg-gray-100 animate-pulse" />
        <div class="h-2.5 rounded bg-gray-100 animate-pulse w-28 hidden md:block" />
        <div class="h-2.5 rounded bg-gray-100 animate-pulse w-24 hidden md:block" />
        <div class="flex gap-1.5 ml-auto">
          <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
          <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="organisations.length === 0"
      icon="building"
      title="No organisations found"
      message="Try adjusting your search or create a new organisation."
    />

    <!-- Desktop Table -->
    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse table-fixed hidden md:table min-w-[850px]">
          <thead>
            <tr class="border-b border-[var(--line)]">
              <th class="w-[28%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Organisation</th>
              <th class="w-[18%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Contact</th>
              <th class="w-[20%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Email</th>
              <th class="w-[8%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Since</th>
              <th class="w-[7%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Users</th>
              <th class="w-[9%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Status</th>
              <th class="w-[10%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] whitespace-nowrap bg-[var(--bg)] text-right">Actions</th>
            </tr>
          </thead>
        <tbody>
          <tr
            v-for="org in organisations"
            :key="org.id"
            class="border-b border-[var(--line-soft)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--teal-50)]"
          >
            <!-- Name + initials avatar -->
            <td class="px-4 py-3.5 align-middle">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-[38px] h-[38px] rounded-[10px] shrink-0 shadow-[0_2px_6px_rgba(10,61,57,0.18)] overflow-hidden">
                  <img v-if="logoSrc(org.logo_url)" :src="logoSrc(org.logo_url)!" :alt="org.name" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-xs font-bold tracking-wide">
                    {{ initials(org.name) }}
                  </div>
                </div>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-[13.5px] font-semibold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis">{{ org.name }}</span>
                  <span class="text-xs text-[var(--ink-400)]">Member since {{ org.member_since }}</span>
                </div>
              </div>
            </td>

            <!-- Contact -->
            <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-700)]">{{ org.contact_name }}</td>

            <!-- Email -->
            <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-400)] whitespace-nowrap overflow-hidden text-ellipsis">{{ org.email }}</td>

            <!-- Since -->
            <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-400)]">{{ org.member_since }}</td>

            <!-- Users count -->
            <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-400)]">{{ org.users_count }}</td>

            <!-- Status -->
            <td class="px-4 py-3.5 align-middle">
              <BaseBadge :tone="org.status === 'active' ? 'green' : 'gray'" dot>
                {{ org.status === 'active' ? 'Active' : 'Inactive' }}
              </BaseBadge>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3.5 align-middle text-right">
              <div class="inline-flex items-center gap-1">
                <button
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                  title="Edit organisation"
                  @click="emit('edit', org)"
                >
                  <BaseIcon name="edit" :size="14" />
                </button>
                <button
                  v-if="org.status === 'active'"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50 hover:shadow-[0_1px_4px_rgba(220,38,38,0.1)]"
                  title="Deactivate organisation"
                  @click="emit('deactivate', org)"
                >
                  <BaseIcon name="ban" :size="14" />
                </button>
                <button
                  v-else
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] hover:shadow-[0_1px_4px_rgba(20,107,99,0.1)]"
                  title="Reactivate organisation"
                  @click="emit('activate', org)"
                >
                  <BaseIcon name="refresh" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Mobile Cards -->
      <div class="flex flex-col md:hidden">
        <div v-for="org in organisations" :key="org.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
          <div class="flex items-center gap-2.5">
            <div class="w-[34px] h-[34px] rounded-[9px] shrink-0 shadow-[0_2px_6px_rgba(10,61,57,0.18)] overflow-hidden">
              <img v-if="logoSrc(org.logo_url)" :src="logoSrc(org.logo_url)!" :alt="org.name" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-[11px] font-bold tracking-wide">
                {{ initials(org.name) }}
              </div>
            </div>
            <div class="flex flex-col gap-0.5 min-w-0 flex-1">
              <span class="text-[13.5px] font-semibold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis">{{ org.name }}</span>
              <span class="text-xs text-[var(--ink-400)]">{{ org.email }}</span>
            </div>
            <BaseBadge :tone="org.status === 'active' ? 'green' : 'gray'" dot>
              {{ org.status === 'active' ? 'Active' : 'Inactive' }}
            </BaseBadge>
          </div>
          <div class="flex items-center flex-wrap gap-2 mt-2.5 pl-11">
            <span class="text-xs text-[var(--ink-600)]">{{ org.contact_name }}</span>
            <span class="text-xs text-[var(--ink-400)]">Since {{ org.member_since }}</span>
            <span class="text-xs text-[var(--ink-400)]">{{ org.users_count }} users</span>
            <span class="text-xs text-[var(--ink-400)]">{{ formatDate(org.created_at) }}</span>
          </div>
          <div class="flex gap-1.5 mt-3 pl-11">
            <button class="btn btn-secondary btn-sm" @click="emit('edit', org)">
              <BaseIcon name="edit" :size="13" /> Edit
            </button>
            <button v-if="org.status === 'active'" class="btn btn-danger-ghost btn-sm" @click="emit('deactivate', org)">
              <BaseIcon name="ban" :size="13" /> Deactivate
            </button>
            <button v-else class="btn btn-secondary btn-sm" @click="emit('activate', org)">
              <BaseIcon name="refresh" :size="13" /> Reactivate
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
