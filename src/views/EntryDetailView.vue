<script setup lang="ts">
import { toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useEntryDetail } from '@/composables/useEntryDetail'
import AppShell from '@/components/AppShell.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import EntryDetailHeader from '@/components/entry_detail/EntryDetailHeader.vue'
import EntryProgrammeIdentity from '@/components/entry_detail/EntryProgrammeIdentity.vue'
import EntryActivitiesList from '@/components/entry_detail/EntryActivitiesList.vue'
import EntryGovernmentAgreements from '@/components/entry_detail/EntryGovernmentAgreements.vue'
import EntryGeographicCoverage from '@/components/entry_detail/EntryGeographicCoverage.vue'
import EntryKeywords from '@/components/entry_detail/EntryKeywords.vue'
import EntryCoordinationNote from '@/components/entry_detail/EntryCoordinationNote.vue'
import RelatedEntriesList from '@/components/entry_detail/RelatedEntriesList.vue'
import { ADVISORY_NOTE_STATUS } from '@/constants/advisoryStatus'

const props = defineProps({ id: String })
const router = useRouter()

import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ProgrammeReportModal from '@/components/programme/ProgrammeReportModal.vue'
import { ref } from 'vue'

const { entry, loading, marking, analysing, status, activityRows, relatedEntries, markVerified, analyseInAdviser, organisations, auth, advisoryNoteStatus }
  = useEntryDetail(toRef(props, 'id'))

const showReportModal = ref(false)

function handleBack() {
  if (auth.isAdmin || (auth as any).userRole === 'nep_coordinator') {
    router.push({ name: 'map' })
  } else {
    router.push({ name: 'dashboard' })
  }
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['Programme entries', (entry as any)?.name || (entry as any)?.programme_name || 'Entry Detail']" />
    </template>

    <div v-if="loading" class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm p-16 flex items-center justify-center">
      <LoadingSpinner message="Loading programme entry details..." />
    </div>

    <div v-else-if="!entry">
      <EmptyState icon="search" title="Entry not found" message="It may have been removed, or the link is out of date.">
        <template #action><BaseButton variant="secondary" size="sm" @click="handleBack">← Back</BaseButton></template>
      </EmptyState>
    </div>

    <template v-else>
      <EntryDetailHeader
        :entry
        :status
        :marking
        :can-verify="auth.hasPermission('programmes.verify')"
        @mark-verified="markVerified"
        @open-report="showReportModal = true"
        @back="handleBack"
      />

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 space-y-6">
          <EntryProgrammeIdentity :entry />
          <EntryActivitiesList :activity-rows="activityRows" />
          <EntryGovernmentAgreements :agreements="entry.governmentAgreements" />
        </div>

        <div class="lg:col-span-5 space-y-6">
          <EntryGeographicCoverage :locations="entry.locations" :other-countries="entry.otherCountries" />
          <EntryKeywords :keywords="entry.keywords" />
          <EntryCoordinationNote
            v-if="auth.isCoordinatorOrAdmin || auth.userRole === 'member_org'"
            :has-overlaps="relatedEntries.length > 0"
            :overlap-count="relatedEntries.length"
            :analysing="analysing"
            :is-member="auth.userRole === 'member_org'"
            :is-delivered="advisoryNoteStatus === ADVISORY_NOTE_STATUS.ADVICE_DELIVERED"
            @analyse="analyseInAdviser"
          />
        </div>
      </div>

      <RelatedEntriesList
        :entries="relatedEntries"
        :org-name-of="organisations.nameOf"
        :org-by-id="organisations.byId"
        @navigate="(id: string) => router.push({ name: 'entry-detail', params: { id } })"
      />

      <ProgrammeReportModal
        :show="showReportModal"
        :entry="entry"
        @close="showReportModal = false"
      />
    </template>
  </AppShell>
</template>
