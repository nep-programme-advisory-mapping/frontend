<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import OrganisationTable from './OrganisationTable.vue'
import OrganisationFormModal from './OrganisationFormModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useOrganisationsStore } from '@/stores/organisations'
import { storeToRefs } from 'pinia'
import { useToast } from '@/utils/toast'
import { usePermission } from '@/composables/usePermission'
import type { Organisation, OrganisationForm } from '@/types/organisations'

const store = useOrganisationsStore()
const { organisations, loading, saving, error, currentPage, lastPage, total, search } = storeToRefs(store)
const orgStore = store
const { hasPermission } = usePermission()

const toast = useToast()
const showFormModal = ref(false)
const editTarget = ref<Organisation | null>(null)
const showConfirm = ref(false)
const confirmTarget = ref<Organisation | null>(null)
const confirmAction = ref<'activate' | 'deactivate'>('deactivate')
const isConfirming = ref(false)

onMounted(() => orgStore.fetchOrganisations(1))

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => orgStore.fetchOrganisations(1), 400)
})

function openCreate() { editTarget.value = null; showFormModal.value = true }
function openEdit(org: Organisation) { editTarget.value = org; showFormModal.value = true }

async function handleFormSubmit(payload: OrganisationForm) {
  try {
    if (editTarget.value) {
      await orgStore.update(editTarget.value.id, payload)
      toast.success('Organisation updated.')
    } else {
      await orgStore.create(payload)
      toast.success('Organisation created.')
    }
    showFormModal.value = false
  } catch (err: any) {
    console.error('[handleFormSubmit] error:', err?.message, err?.response?.status, err?.response?.data)
    if (err?.message === 'logo_upload_failed') {
      await orgStore.fetchOrganisations(1)
      showFormModal.value = false
      toast.error('Logo upload failed — you can re-upload it by editing the organisation.')
    } else {
      toast.error('Failed to save organisation.')
    }
  }
}

function openConfirm(org: Organisation, action: 'activate' | 'deactivate') {
  confirmTarget.value = org
  confirmAction.value = action
  showConfirm.value = true
}

async function handleConfirm() {
  if (!confirmTarget.value) return
  isConfirming.value = true
  try {
    if (confirmAction.value === 'activate') {
      await orgStore.activate(confirmTarget.value.id)
      toast.success('Organisation reactivated.')
    } else {
      await orgStore.deactivate(confirmTarget.value.id)
      toast.success('Organisation deactivated.')
    }
  } catch {
    toast.error('Action failed.')
  } finally {
    isConfirming.value = false
    showConfirm.value = false
    confirmTarget.value = null
  }
}
</script>

<template>
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 mt-2">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Organisation Management</h1>
      <p class="mt-1 text-xs sm:text-sm text-slate-500 font-medium">Manage member organisations, contacts and status.</p>
    </div>
    <button
        v-if="hasPermission('organisations.create')"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto" @click="openCreate">
      <BaseIcon name="plus" :size="15" />
      Create Organisation
    </button>
  </div>

  <!-- Stats Row -->
  <div v-if="!loading && total > 0" class="flex gap-2.5 mb-4.5 flex-wrap">
    <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--card)] border border-[var(--line)] rounded-[9px] text-[12.5px] text-[var(--ink-500)]">
      <BaseIcon name="building" :size="14" />
      <span><strong class="text-[var(--ink-900)] font-bold">{{ total }}</strong> total organisations</span>
    </div>
    <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--card)] border border-[var(--line)] rounded-[9px] text-[12.5px] text-[var(--ink-500)]">
      <BaseIcon name="check" :size="14" />
      <span><strong class="text-[var(--ink-900)] font-bold">{{ organisations.filter(o => o.status === 'active').length }}</strong> active</span>
    </div>
  </div>

  <!-- Search -->
  <div class="flex gap-3 items-center flex-wrap mb-4">
    <div class="relative max-w-[360px] flex-1 min-w-[280px]">
      <span class="absolute left-[13px] top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none flex">
        <BaseIcon name="search" :size="15" />
      </span>
      <input
        v-model="search"
        type="text"
        placeholder="Search by name or contact…"
        class="w-full border border-[var(--line)] rounded-xl py-2.5 pl-9.5 pr-3.5 text-xs text-[var(--ink-900)] bg-[var(--card)] transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)] placeholder:text-[var(--ink-300)]"
      />
    </div>
  </div>

  <!-- Error -->
  <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>

  <!-- Table + Pagination -->
  <div class="flex flex-col gap-0">
    <OrganisationTable
      :organisations="organisations"
      :is-loading="loading"
      @edit="openEdit"
      @deactivate="(org) => openConfirm(org, 'deactivate')"
      @activate="(org) => openConfirm(org, 'activate')"
    />

    <div
      v-if="!loading && lastPage > 1"
      class="flex items-center justify-between gap-3 p-3.5 px-5 bg-[var(--card)] border border-[var(--line)] border-t-0 rounded-b-[var(--radius)] flex-col sm:flex-row"
    >
      <span class="text-xs text-[var(--ink-400)]">Page {{ currentPage }} of {{ lastPage }} · {{ total }} total</span>
      <div class="flex items-center gap-0.5">
        <button
          class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="orgStore.fetchOrganisations(currentPage - 1)"
        >‹ Prev</button>
        <button
          class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
          :disabled="currentPage === lastPage"
          @click="orgStore.fetchOrganisations(currentPage + 1)"
        >Next ›</button>
      </div>
    </div>
  </div>

  <!-- Form Modal -->
  <OrganisationFormModal
    :open="showFormModal"
    :edit-org="editTarget"
    :is-saving="saving"
    @close="showFormModal = false"
    @submit="handleFormSubmit"
  />

  <!-- Confirm Deactivate / Activate Modal -->
  <BaseModal :open="showConfirm" @close="showConfirm = false">
    <div class="text-center max-w-[380px] mx-auto">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
        :class="confirmAction === 'deactivate' ? 'bg-[var(--red-100)] text-[var(--red-600)]' : 'bg-[var(--teal-100)] text-[var(--teal-700)]'"
      >
        <BaseIcon :name="confirmAction === 'deactivate' ? 'alert' : 'refresh'" :size="22" />
      </div>
      <h3 class="text-base font-bold text-[var(--ink-900)] mb-2">
        {{ confirmAction === 'deactivate' ? 'Deactivate Organisation' : 'Reactivate Organisation' }}
      </h3>
      <p class="text-[13.5px] text-[var(--ink-500)] leading-relaxed">
        Are you sure you want to {{ confirmAction === 'deactivate' ? 'deactivate' : 'reactivate' }}
        <strong class="text-[var(--ink-900)] font-semibold">{{ confirmTarget?.name }}</strong>?
        <template v-if="confirmAction === 'deactivate'"> Users in this organisation will lose access.</template>
      </p>
      <div class="flex justify-center gap-2.5 mt-5.5">
        <button class="btn btn-secondary" :disabled="isConfirming" @click="showConfirm = false">Cancel</button>
        <button
          :class="confirmAction === 'deactivate' ? 'btn btn-danger' : 'btn btn-primary'"
          :disabled="isConfirming"
          @click="handleConfirm"
        >
          <svg v-if="isConfirming" class="w-3.5 h-3.5 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ isConfirming ? 'Working…' : confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate' }}
        </button>
      </div>
    </div>
  </BaseModal>

  <ToastHost />
</template>
