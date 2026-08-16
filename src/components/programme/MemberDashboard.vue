<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import DashboardGuidance from '@/components/programme/DashboardGuidance.vue'
import { useEntriesStore } from '@/stores/entries.store'
import { useAuthStore } from '@/stores/auth'
import NewEntryButton from '@/components/programme/NewEntryButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ProgrammeReportModal from '@/components/programme/ProgrammeReportModal.vue'
import OrganisationAllProgrammesReportModal from '@/components/programme/OrganisationAllProgrammesReportModal.vue'

import { downloadOrganisationProgrammesPdf } from '@/api/programmeReport.api'
import { useToast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()
const entries = useEntriesStore()
const auth = useAuthStore()
const toast = useToast()

const canSeeDraft = computed(() => !['nep_admin', 'nep_coordinator'].includes(auth.userRole))

const selectedReportEntry = ref<any>(null)
const showReportModal = ref(false)
const showExportAllModal = ref(false)
const exportingAll = ref(false)

function openReportModal(entry: any) {
  selectedReportEntry.value = entry
  showReportModal.value = true
}

async function handleExportAllProgrammes() {
  const orgId = (auth.currentUser as any)?.organisation_id ?? (auth.currentUser as any)?.organisation?.id
  if (!orgId) {
    toast.error('Organisation context not found.')
    return
  }
  exportingAll.value = true
  try {
    const orgName = ((auth.currentUser as any)?.organisation?.name || 'Organisation').replace(/[^a-zA-Z0-9]/g, '_')
    await downloadOrganisationProgrammesPdf(orgId, `${orgName}_All_Programmes.pdf`)
    toast.success('All programmes report exported successfully!')
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to export organisation programmes PDF.')
  } finally {
    exportingAll.value = false
  }
}

watch(() => route.query.tab, () => {
  const requestedTab = route.query.tab as 'all' | 'draft' | 'submitted' || 'all'
  const validTabs = ['all', 'draft', 'submitted']
  const parsedTab = validTabs.includes(requestedTab) ? requestedTab : 'all'
  const tab = !canSeeDraft.value && parsedTab !== 'submitted' ? 'submitted' : parsedTab
  entries.switchTab(tab as 'all' | 'draft' | 'submitted', true)
}, { immediate: true })
</script>

<template>

  <!-- Verification Alert Box -->
  <div v-if="entries.unverifiedCount > 0"
    class="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start justify-between gap-4">
    <div class="flex gap-3">
      <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 font-bold">
        !
      </div>
      <div>
        <h4 class="text-sm font-semibold text-amber-900">
          {{ entries.unverifiedCount }} {{ entries.unverifiedCount === 1 ? 'entry' : 'entries' }} require attention
        </h4>
        <p class="text-xs text-amber-700/90 mt-0.5">
          Please review your unverified entries to ensure all information is up to date and accurate.
        </p>
      </div>
    </div>
  </div>

  <!-- Page Heading + CTA under header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 mt-2">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
      <p class="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
        Overview of registered programme entries and status tracking.
      </p>
    </div>
    <NewEntryButton />
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <KpiCard label="Total Entries" :value="entries.currentItems.length" icon="list" icon-tone="indigo" />
    <KpiCard label="Verified" :value="entries.verifiedCount" icon="check" icon-tone="green" />
    <KpiCard label="Unverified" :value="entries.unverifiedCount" icon="alert" icon-tone="amber" />
  </div>

  <!-- Tabs -->
  <PageHeader
    title="Your programme entries"
    subtitle="Organisational account — visible to your organisation and NEP staff"
    mb="mb-3"
  >
    <div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
      <button v-if="canSeeDraft"
        :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors', entries.activeTab === 'all' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
        @click="entries.switchTab('all')">
        All
      </button>
      <button v-if="canSeeDraft"
        :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors', entries.activeTab === 'draft' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
        @click="entries.switchTab('draft')">
        Draft
      </button>
      <button
        :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors', entries.activeTab === 'submitted' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
        @click="entries.switchTab('submitted')">
        Submitted
      </button>
    </div>
  </PageHeader>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
      <h2 class="text-sm font-semibold text-gray-800 capitalize">{{ entries.activeTab }} entries</h2>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-400">{{ entries.currentPagination.total }} total</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="entries.currentLoading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Error state -->
    <div v-else-if="entries.currentError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="text-gray-400 mb-2">
          <BaseIcon name="alert" :size="32" />
        </div>
        <p class="text-sm text-red-500 mb-3">{{ entries.currentError }}</p>
        <button
          class="text-sm font-medium text-teal-700 hover:text-teal-600 bg-teal-50 px-3 py-1.5 rounded-md border border-teal-200 transition-colors"
          @click="entries.retry">
          Try again
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="entries.currentItems.length === 0" class="py-12">
      <EmptyState
        icon="file"
        :title="entries.activeTab === 'all' ? 'No entries' : (entries.activeTab === 'draft' ? 'No draft entries' : 'No submitted entries')"
        :message="entries.activeTab === 'all' ? 'You haven\'t created any programme entries yet.' : (entries.activeTab === 'draft' ? 'You haven\'t created any draft programme entries yet.' : 'No programme entries have been submitted yet.')"
      >
        <template #action>
          <NewEntryButton />
        </template>
      </EmptyState>
    </div>

    <!-- Entries list -->
    <template v-else>
      <!-- Desktop Table View (visible on sm and up) -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <th class="text-left px-5 py-3">Programme</th>
              <th class="text-left px-5 py-3">Status</th>
              <th class="text-left px-5 py-3 hidden sm:table-cell">Coverage</th>
              <th class="text-left px-5 py-3 hidden md:table-cell">Core activities</th>
              <th class="text-left px-5 py-3 hidden sm:table-cell">Last updated</th>
              <th class="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(entry, index) in entries.entriesWithStatus" :key="entry.id ?? index"
              class="hover:bg-gray-50 transition-colors cursor-pointer">
              <td class="px-5 py-3.5">
                <div class="text-sm font-medium text-gray-800">{{ entry.name || 'Untitled' }}</div>
                <div class="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-1.5">
                  <span :class="entry.isDraft ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'" class="px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {{ entry.isDraft ? 'Draft' : 'Submitted' }}
                  </span>
                  <span>{{ entry.startYear }}–{{ entry.endYear || 'ongoing' }}</span>
                  <span v-if="entry.budgetBand"> · {{ entry.budgetBand }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-1.5">
                  <StatusBadge v-if="entry.status === 'Verified'" label="Verified" variant="success" />
                  <StatusBadge v-else :label="entry.unverifiedLabel" variant="warning" />
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell">
                <template v-if="entry.provinces && entry.provinces.length">
                  {{ entry.provincesDisplay }}
                  <span v-if="entry.hasMoreProvinces" class="text-gray-400"> +{{ entry.moreProvincesCount }}</span>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-5 py-3.5 hidden md:table-cell">
                <div class="flex flex-wrap gap-1">
                  <BaseBadge v-for="code in (entry.primaryCodes || [])" :key="code" tone="teal">{{ code }}</BaseBadge>
                  <span v-if="!entry.primaryCodes?.length" class="text-xs text-gray-300">—</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
                {{ entry.relativeLastUpdated }}
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-1.5" @click.stop>
                  <button v-if="entry.status === 'Unverified'"
                    class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap">
                    Still current
                  </button>
                  <button
                    class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
                    @click="openReportModal(entry)">
                    <BaseIcon name="file" :size="13" /> Report
                  </button>
                  <button
                    class="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 transition-colors whitespace-nowrap"
                    @click="router.push(`/entries/new?id=${entry.id}`)">
                    Edit
                  </button>
                  <button
                    class="px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap"
                    :class="entry.isDraft ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'"
                    :disabled="entry.isDraft"
                    @click="router.push(`/entries/${entry.id}`)">
                    Open →
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View (visible on screens < sm) -->
      <div class="sm:hidden divide-y divide-gray-100">
        <div v-for="(entry, index) in entries.entriesWithStatus" :key="entry.id ?? index"
          class="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer space-y-3"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-gray-800 truncate">{{ entry.name || 'Untitled' }}</h4>
              <p class="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span :class="entry.isDraft ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'" class="px-1.5 py-0.5 rounded text-[10px] font-medium">
                  {{ entry.isDraft ? 'Draft' : 'Submitted' }}
                </span>
                <span>{{ entry.startYear }}–{{ entry.endYear || 'ongoing' }}</span>
                <span v-if="entry.budgetBand"> · {{ entry.budgetBand }}</span>
              </p>
            </div>
            <StatusBadge v-if="entry.status === 'Verified'" label="Verified" variant="success" />
            <StatusBadge v-else :label="entry.unverifiedLabel" variant="warning" />
          </div>

          <div class="flex items-center justify-between gap-4 text-xs text-gray-400">
            <div>Updated {{ entry.relativeLastUpdated }}</div>
            <div class="flex items-center gap-1.5 flex-wrap justify-end" @click.stop>
              <button v-if="entry.status === 'Unverified'"
                class="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer">
                Still current
              </button>
              <button
                class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
                @click="openReportModal(entry)">
                <BaseIcon name="file" :size="13" /> Report
              </button>
              <button
                class="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 transition-colors whitespace-nowrap cursor-pointer"
                @click="router.push(`/entries/new?id=${entry.id}`)">
                Edit
              </button>
              <button
                class="px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap cursor-pointer"
                :class="entry.isDraft ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'"
                :disabled="entry.isDraft"
                @click="router.push(`/entries/${entry.id}`)">
                Open →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination (visible on both) -->
      <div v-if="entries.currentPagination.lastPage > 1"
        class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-500">
          Page {{ entries.currentPagination.currentPage }} of {{ entries.currentPagination.lastPage }}
        </span>
        <div class="flex gap-2">
          <button
            :disabled="entries.currentPagination.currentPage <= 1"
            :class="['px-3 py-1 text-xs font-medium rounded-md border transition-colors', entries.currentPagination.currentPage <= 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50']"
            @click="entries.goToPage(entries.currentPagination.currentPage - 1)">
            Previous
          </button>
          <button
            :disabled="entries.currentPagination.currentPage >= entries.currentPagination.lastPage"
            :class="['px-3 py-1 text-xs font-medium rounded-md border transition-colors', entries.currentPagination.currentPage >= entries.currentPagination.lastPage ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50']"
            @click="entries.goToPage(entries.currentPagination.currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </template>
  </div>

  <DashboardGuidance />

  <ProgrammeReportModal
    :show="showReportModal"
    :entry="selectedReportEntry"
    @close="showReportModal = false"
  />

  <OrganisationAllProgrammesReportModal
    :show="showExportAllModal"
    :organisation-id="(auth.currentUser as any)?.organisation_id ?? (auth.currentUser as any)?.organisation?.id ?? null"
    :organisation-name="(auth.currentUser as any)?.organisation?.name || 'Organisation'"
    @close="showExportAllModal = false"
  />
</template>
