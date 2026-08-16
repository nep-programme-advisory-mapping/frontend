<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import UserTable from '@/components/user/UserTable.vue'
import UserFormModal from '@/components/user/UserFormModal.vue'
import UserViewModal from '@/components/user/UserViewModal.vue'
import ConfirmDeactivateModal from '@/components/user/ConfirmDeactivateModal.vue'
import ConfirmDeleteUserModal from '@/components/user/ConfirmDeleteUserModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import { onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useUsersAdminStore } from '@/stores/usersAdmin'
import { useRolesAdminStore } from '@/stores/rolesAdmin'

const { hasPermission } = usePermission()
const store = useUsersAdminStore()
const usersComposable = store.usersComposable
const rolesStore = useRolesAdminStore()

// The role picker in the create/edit modal needs the live roles list —
// fetch it once alongside the user list. Uses fetchRoles() (not fetchAll())
// since this page's users.create/update permission is enough to list roles,
// even without permissions.view.
onMounted(() => {
  rolesStore.fetchRoles()
})
</script>

<template>
  <!-- ── Page Header ── -->
  <PageHeader
    title="User Management"
    subtitle="Manage system accounts, roles and organisation access."
  >
    <button
      v-if="hasPermission('users.create')"
      id="create-user-btn"
      class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
      @click="store.openCreateModal"
    >
      <BaseIcon name="plus" :size="15" />
      Create User
    </button>
  </PageHeader>

  <!-- ── Stats Row ── -->
  <div v-if="!usersComposable.isLoading && usersComposable.totalItems > 0" class="flex gap-2.5 mb-4.5 flex-wrap">
    <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--card)] border border-[var(--line)] rounded-[9px] text-[12.5px] text-[var(--ink-500)]">
      <BaseIcon name="users" :size="14" />
      <span><strong class="text-[var(--ink-900)] font-bold">{{ usersComposable.totalItems }}</strong> total users</span>
    </div>
    <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--card)] border border-[var(--line)] rounded-[9px] text-[12.5px] text-[var(--ink-500)]">
      <BaseIcon name="check" :size="14" />
      <span><strong class="text-[var(--ink-900)] font-bold">{{ usersComposable.users.filter(u => u.status === 'active').length }}</strong> active</span>
    </div>
  </div>

  <!-- ── Search + Filters ── -->
  <div class="flex gap-3 items-center flex-wrap mb-4">
    <div class="relative w-full md:w-[360px] flex-1 min-w-0">
      <span class="absolute left-[13px] top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none flex">
        <BaseIcon name="search" :size="15" />
      </span>
      <input
        id="user-search"
        v-model="usersComposable.searchQuery"
        type="text"
        placeholder="Search by name or email…"
        class="w-full border border-[var(--line)] rounded-xl py-2.5 pl-9.5 pr-8 text-xs text-[var(--ink-900)] bg-[var(--card)] transition-all duration-150 focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)] placeholder:text-[var(--ink-300)]"
      />
      <button
        v-if="usersComposable.searchQuery"
        type="button"
        @click="usersComposable.searchQuery = ''"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-700)] cursor-pointer p-1"
        aria-label="Clear search"
      >
        <BaseIcon name="x" :size="12" />
      </button>
    </div>

    <div class="flex gap-2.5 flex-wrap w-full md:w-auto">
      <select id="user-role-filter" v-model="usersComposable.roleFilter" class="flex-1 sm:flex-initial min-w-0 sm:min-w-[140px] border border-[var(--line)] rounded-xl bg-[var(--card)] px-3 py-2.5 text-xs text-[var(--ink-700)]">
        <option value="">All roles</option>
        <option v-for="r in rolesStore.roles" :key="r.id" :value="r.name">{{ r.display_name || r.name }}</option>
      </select>

      <select id="user-status-filter" v-model="usersComposable.statusFilter" class="flex-1 sm:flex-initial min-w-0 sm:min-w-[140px] border border-[var(--line)] rounded-xl bg-[var(--card)] px-3 py-2.5 text-xs text-[var(--ink-700)]">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select id="user-per-page-filter" v-model.number="usersComposable.perPage" class="flex-1 sm:flex-initial min-w-0 sm:min-w-[140px] border border-[var(--line)] rounded-xl bg-[var(--card)] px-3 py-2.5 text-xs text-[var(--ink-700)]">
        <option :value="10">10 per page</option>
        <option :value="25">25 per page</option>
        <option :value="50">50 per page</option>
        <option :value="100">100 per page</option>
      </select>
    </div>
  </div>

  <!-- ── User List Table ── -->
  <div class="flex flex-col gap-0">
    <UserTable
      :users="usersComposable.filteredUsers"
      :is-loading="usersComposable.isLoading"
      @view="store.openViewModal"
      @edit="store.openEditModal"
      @deactivate="store.openDeactivateModal"
      @reactivate="store.handleReactivateUser"
      @resetCredentials="store.handleResetCredentials"
      @remove="store.openDeleteModal"
    />

    <!-- Pagination footer -->
    <div
      v-if="!usersComposable.isLoading && usersComposable.totalItems > usersComposable.perPage"
      class="flex items-center justify-between gap-3 p-3.5 px-5 bg-[var(--card)] border border-[var(--line)] border-t-0 rounded-b-[var(--radius)] flex-col sm:flex-row"
    >
      <span class="text-xs text-[var(--ink-400)]">
        Showing {{ (usersComposable.currentPage - 1) * usersComposable.perPage + 1 }}–{{ Math.min(usersComposable.currentPage * usersComposable.perPage, usersComposable.totalItems) }}
        of {{ usersComposable.totalItems }}
      </span>
      <div class="flex items-center gap-0.5">
        <button
          class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:not-disabled:border-[var(--teal-600)] hover:not-disabled:text-[var(--teal-700)] hover:not-disabled:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
          :disabled="usersComposable.currentPage === 1"
          @click="usersComposable.fetchUsers(usersComposable.currentPage - 1)"
        >
          ‹ Prev
        </button>
        <template v-for="(p, idx) in store.paginationPages" :key="p">
          <span v-if="idx > 0 && p - (store.paginationPages[idx - 1] ?? p) > 1" class="inline-flex w-7 justify-center text-xs text-[var(--ink-400)]">…</span>
          <button
            class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:not-disabled:border-[var(--teal-600)] hover:not-disabled:text-[var(--teal-700)] hover:not-disabled:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
            :class="{ 'bg-[var(--teal-800)] border-[var(--teal-800)] text-white': p === usersComposable.currentPage }"
            @click="usersComposable.fetchUsers(p)"
          >
            {{ p }}
          </button>
        </template>
        <button
          class="min-w-[34px] h-[34px] inline-flex items-center justify-center px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[12.5px] font-semibold text-[var(--ink-600)] cursor-pointer transition-all duration-120 whitespace-nowrap hover:not-disabled:border-[var(--teal-600)] hover:not-disabled:text-[var(--teal-700)] hover:not-disabled:bg-[var(--teal-50)] disabled:opacity-35 disabled:cursor-not-allowed"
          :disabled="usersComposable.currentPage === usersComposable.lastPage"
          @click="usersComposable.fetchUsers(usersComposable.currentPage + 1)"
        >
          Next ›
        </button>
      </div>
    </div>
  </div>

  <!-- ── Modals ── -->
  <UserFormModal
    :open="store.showFormModal"
    :edit-user="store.editTarget"
    :is-saving="usersComposable.isSaving"
    :organisations="usersComposable.organisations"
    :roles="rolesStore.roles"
    :backend-errors="usersComposable.fieldErrors"
    @close="store.showFormModal = false"
    @submit="store.handleFormSubmit"
  />

  <UserViewModal
    :open="store.showViewModal"
    :user="store.viewTarget"
    @close="store.showViewModal = false"
  />

  <ConfirmDeactivateModal
    :open="store.showDeactivateModal"
    :user="store.deactivateTarget"
    :is-loading="usersComposable.isSaving"
    @confirm="store.handleDeactivateConfirm"
    @cancel="store.showDeactivateModal = false"
  />

  <ConfirmDeleteUserModal
    :open="store.showDeleteModal"
    :user="store.deleteTarget"
    :is-loading="usersComposable.isSaving"
    @confirm="store.handleDeleteConfirm"
    @cancel="store.showDeleteModal = false"
  />

  <!-- Toast notifications -->
  <ToastHost />
</template>
