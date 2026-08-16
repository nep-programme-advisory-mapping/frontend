<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import { useAdminProgrammes } from '@/composables/useAdminProgrammes'

const programmes = useAdminProgrammes()
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Programme entries" />
    </template>

    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row">
      <div>
        <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-tight">Programme Entries</h1>
        <p class="text-xs text-[var(--ink-400)] mt-1">Submitted entries from all organisations.</p>
      </div>
      <button class="btn btn-primary" @click="programmes.openCreatePicker">
        <BaseIcon name="plus" :size="14" />
        Create for Organisation
      </button>
    </div>

    <!-- Tabs -->
    <div class="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5 border-b border-[var(--line)]">
      <div class="flex gap-1 min-w-0 w-max">
        <button
          class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap"
          :class="programmes.activeTab === 'submitted' ? 'border-[var(--teal-600)] text-[var(--teal-700)]' : 'border-transparent text-[var(--ink-400)] hover:text-[var(--ink-700)]'"
          @click="programmes.setTab('submitted')"
        >All Submitted</button>
        <button
          class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap"
          :class="programmes.activeTab === 'my-drafts' ? 'border-[var(--teal-600)] text-[var(--teal-700)]' : 'border-transparent text-[var(--ink-400)] hover:text-[var(--ink-700)]'"
          @click="programmes.setTab('my-drafts')"
        >
          My Drafts
          <span v-if="programmes.myDrafts.length > 0" class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--teal-100)] text-[var(--teal-700)] text-[10px] font-bold">{{ programmes.myDrafts.length }}</span>
        </button>
      </div>
    </div>

    <!-- Submitted tab -->
    <template v-if="programmes.activeTab === 'submitted'">
      <!-- Org filter -->
      <div class="flex gap-3 items-center flex-wrap mb-4">
        <select
          :value="programmes.selectedOrgName"
          class="border border-[var(--line)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--ink-900)] bg-[var(--card)] focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]"
          @change="programmes.onOrgFilterChange"
        >
          <option value="">All organisations</option>
          <option v-for="name in programmes.orgOptions" :key="name" :value="name">{{ name }}</option>
        </select>
        <span class="text-xs text-[var(--ink-400)]">{{ programmes.displayTotal }} total entries</span>
      </div>

      <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden">
        <div v-if="programmes.entriesLoading" class="flex items-center justify-center py-16">
          <svg class="animate-spin h-5 w-5 text-[var(--ink-400)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div v-else-if="programmes.entriesError" class="py-12 text-center text-sm text-red-500">{{ programmes.entriesError }}</div>
        <div v-else-if="programmes.filteredEntries.length === 0" class="py-16 text-center text-sm text-[var(--ink-400)]">No programme entries found.</div>
        <template v-else>
          <!-- Desktop table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[600px] hidden md:table">
              <thead>
                <tr class="border-b border-[var(--line)] text-xs font-semibold text-[var(--ink-400)] uppercase tracking-wider">
                  <th class="text-left px-5 py-3">Programme</th>
                  <th class="text-left px-5 py-3 hidden sm:table-cell">Organisation</th>
                  <th class="text-left px-5 py-3 hidden lg:table-cell">Core activities</th>
                  <th class="text-left px-5 py-3 hidden md:table-cell">Status</th>
                  <th class="text-left px-5 py-3 hidden sm:table-cell">Updated</th>
                  <th class="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--line-soft)]">
                <tr v-for="entry in programmes.filteredEntries" :key="entry.id" class="hover:bg-[var(--bg)] transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="font-medium text-[var(--ink-900)]">{{ entry.programme_name || 'Untitled' }}</div>
                    <div class="text-xs text-[var(--ink-400)] mt-0.5">{{ entry.start_year }}–{{ entry.end_year || 'ongoing' }}</div>
                  </td>
                  <td class="px-5 py-3.5 text-xs text-[var(--ink-500)] hidden sm:table-cell">{{ entry.organisation?.name ?? '—' }}</td>
                  <td class="px-5 py-3.5 hidden lg:table-cell">
                    <div class="flex flex-wrap gap-1">
                      <BaseBadge v-for="code in (entry.primaryActivities || [])" :key="code" tone="teal">{{ code }}</BaseBadge>
                      <span v-if="!entry.primaryActivities?.length" class="text-xs text-gray-300">—</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 hidden md:table-cell">
                    <StatusBadge v-if="!entry.is_unverified" label="Verified" variant="success" />
                    <StatusBadge v-else label="Unverified" variant="warning" />
                  </td>
                  <td class="px-5 py-3.5 text-xs text-[var(--ink-400)] hidden sm:table-cell whitespace-nowrap">{{ entry.relativeUpdated }}</td>
                  <td class="px-5 py-3.5" @click.stop>
                    <button class="px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors whitespace-nowrap" @click="programmes.openEntry(entry.id)">Open →</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile cards -->
          <div class="flex flex-col md:hidden">
            <div v-for="entry in programmes.filteredEntries" :key="entry.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
              <div class="font-medium text-[var(--ink-900)] text-sm">{{ entry.programme_name || 'Untitled' }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-[var(--ink-400)]">{{ entry.start_year }}–{{ entry.end_year || 'ongoing' }}</span>
                <template v-if="entry.is_unverified !== undefined">
                  <StatusBadge v-if="!entry.is_unverified" label="Verified" variant="success" />
                  <StatusBadge v-else label="Unverified" variant="warning" />
                </template>
              </div>
              <div class="flex items-center flex-wrap gap-2 mt-2 text-xs text-[var(--ink-500)]">
                <span v-if="entry.organisation?.name" class="truncate max-w-[160px]">{{ entry.organisation.name }}</span>
                <span class="text-[var(--ink-400)] whitespace-nowrap">{{ entry.relativeUpdated }}</span>
              </div>
              <div v-if="entry.primaryActivities?.length" class="flex flex-wrap gap-1 mt-2">
                <BaseBadge v-for="code in entry.primaryActivities.slice(0, 3)" :key="code" tone="teal">{{ code }}</BaseBadge>
                <BaseBadge v-if="entry.primaryActivities.length > 3" tone="gray">+{{ entry.primaryActivities.length - 3 }}</BaseBadge>
              </div>
              <button class="mt-2.5 px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors" @click="programmes.openEntry(entry.id)">Open →</button>
            </div>
          </div>
        </template>
        <div v-if="!programmes.entriesLoading && programmes.lastPage > 1" class="flex items-center justify-between gap-3 p-3.5 px-5 border-t border-[var(--line)]">
          <span class="text-xs text-[var(--ink-400)]">Page {{ programmes.currentPage }} of {{ programmes.lastPage }}</span>
          <div class="flex gap-0.5">
            <button class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] disabled:opacity-35 disabled:cursor-not-allowed" :disabled="programmes.currentPage === 1" @click="programmes.fetchEntries(programmes.currentPage - 1)">‹ Prev</button>
            <button class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] disabled:opacity-35 disabled:cursor-not-allowed" :disabled="programmes.currentPage === programmes.lastPage" @click="programmes.fetchEntries(programmes.currentPage + 1)">Next ›</button>
          </div>
        </div>
      </div>
    </template>

    <!-- My Drafts tab -->
    <template v-else>
      <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] overflow-hidden">
        <div v-if="programmes.myDraftsLoading" class="flex items-center justify-center py-16">
          <svg class="animate-spin h-5 w-5 text-[var(--ink-400)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div v-else-if="programmes.myDraftsError" class="py-12 text-center text-sm text-red-500">{{ programmes.myDraftsError }}</div>
        <div v-else-if="programmes.myDrafts.length === 0" class="py-16 text-center text-sm text-[var(--ink-400)]">No drafts yet. Create an entry for an organisation to see it here.</div>
        <template v-else>
          <!-- Desktop table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[500px] hidden md:table">
              <thead>
                <tr class="border-b border-[var(--line)] text-xs font-semibold text-[var(--ink-400)] uppercase tracking-wider">
                  <th class="text-left px-5 py-3">Programme</th>
                  <th class="text-left px-5 py-3 hidden sm:table-cell">Organisation</th>
                  <th class="text-left px-5 py-3 hidden lg:table-cell">Core activities</th>
                  <th class="text-left px-5 py-3 hidden sm:table-cell">Updated</th>
                  <th class="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--line-soft)]">
                <tr v-for="entry in programmes.myDrafts" :key="entry.id" class="hover:bg-[var(--bg)] transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="font-medium text-[var(--ink-900)]">{{ entry.programme_name || 'Untitled' }}</div>
                    <div class="text-xs text-[var(--ink-400)] mt-0.5">{{ entry.start_year }}–{{ entry.end_year || 'ongoing' }}</div>
                  </td>
                  <td class="px-5 py-3.5 text-xs text-[var(--ink-500)] hidden sm:table-cell">{{ entry.organisation?.name ?? '—' }}</td>
                  <td class="px-5 py-3.5 hidden lg:table-cell">
                    <div class="flex flex-wrap gap-1">
                      <BaseBadge v-for="code in (entry.primaryActivities || [])" :key="code" tone="teal">{{ code }}</BaseBadge>
                      <span v-if="!entry.primaryActivities?.length" class="text-xs text-gray-300">—</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 text-xs text-[var(--ink-400)] hidden sm:table-cell whitespace-nowrap">{{ entry.relativeUpdated }}</td>
                  <td class="px-5 py-3.5" @click.stop>
                    <button class="px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors whitespace-nowrap" @click="programmes.openEntry(entry.id)">Continue →</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Mobile cards -->
          <div class="flex flex-col md:hidden">
            <div v-for="entry in programmes.myDrafts" :key="entry.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
              <div class="font-medium text-[var(--ink-900)] text-sm">{{ entry.programme_name || 'Untitled' }}</div>
              <div class="text-xs text-[var(--ink-400)] mt-1">{{ entry.start_year }}–{{ entry.end_year || 'ongoing' }}</div>
              <div class="flex items-center flex-wrap gap-2 mt-2 text-xs text-[var(--ink-500)]">
                <span v-if="entry.organisation?.name" class="truncate max-w-[160px]">{{ entry.organisation.name }}</span>
                <span class="text-[var(--ink-400)] whitespace-nowrap">{{ entry.relativeUpdated }}</span>
              </div>
              <div v-if="entry.primaryActivities?.length" class="flex flex-wrap gap-1 mt-2">
                <BaseBadge v-for="code in entry.primaryActivities.slice(0, 3)" :key="code" tone="teal">{{ code }}</BaseBadge>
                <BaseBadge v-if="entry.primaryActivities.length > 3" tone="gray">+{{ entry.primaryActivities.length - 3 }}</BaseBadge>
              </div>
              <button class="mt-2.5 px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] bg-[var(--bg)] border border-[var(--line)] rounded-md hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] transition-colors" @click="programmes.openEntry(entry.id)">Continue →</button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Org Picker Modal -->
    <BaseModal :open="programmes.showOrgPicker" @close="programmes.closeOrgPicker">
      <div class="w-full max-w-sm">
        <h2 class="text-base font-bold text-[var(--ink-900)] mb-1">Select Organisation</h2>
        <p class="text-xs text-[var(--ink-400)] mb-4">Choose the organisation you're creating this entry for.</p>

        <input
          :value="programmes.pickerSearch"
          type="text"
          placeholder="Search organisations…"
          class="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]"
          @input="programmes.onPickerSearchInput"
        />

        <div v-if="programmes.orgsPickerLoading" class="flex items-center justify-center py-8">
          <svg class="animate-spin h-5 w-5 text-[var(--ink-400)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <div v-else class="max-h-60 overflow-y-auto flex flex-col gap-1">
          <button
            v-for="org in programmes.filteredPickerOrgs"
            :key="org.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all text-sm"
            :class="programmes.pickerOrgId === org.id ? 'border-[var(--teal-600)] bg-[var(--teal-50)] text-[var(--teal-800)]' : 'border-[var(--line)] hover:border-[var(--teal-400)] text-[var(--ink-700)]'"
            @click="programmes.setPickerOrgId(org.id)"
          >
            <div class="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-[10px] font-bold">
              <img v-if="org.logo_url" :src="org.logo_url" :alt="org.name" class="w-full h-full object-cover" />
              <span v-else>{{ org.name.slice(0, 2).toUpperCase() }}</span>
            </div>
            <span class="flex-1 font-medium truncate">{{ org.name }}</span>
            <svg v-if="programmes.pickerOrgId === org.id" class="w-4 h-4 text-[var(--teal-600)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <p v-if="programmes.filteredPickerOrgs.length === 0" class="text-xs text-[var(--ink-400)] text-center py-4">No organisations found.</p>
        </div>

        <div class="flex justify-end gap-2.5 mt-5 pt-4 border-t border-[var(--line-soft)]">
          <button class="btn btn-secondary" @click="programmes.closeOrgPicker">Cancel</button>
          <button class="btn btn-primary" :disabled="!programmes.pickerOrgId" @click="programmes.confirmCreate">
            Continue →
          </button>
        </div>
      </div>
    </BaseModal>

    <ToastHost />
  </AppShell>
</template>
