<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseIcon from '@/components/common/BaseIcon.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import OrganisationAllProgrammesReportModal from '@/components/programme/OrganisationAllProgrammesReportModal.vue'

import nepLogo from '@/assets/images/logoes/NEP-logoo.webp'

const auth = useAuthStore()
const isSidebarOpen = ref(false)
const showExportAllModal = ref(false)

/** Filter out nav items the user's permissions don't cover; items with no `permission` are always shown. */
function visibleItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.permission || auth.hasPermission(item.permission))
}

interface NavItem {
  to: string
  label: string
  icon: string
  badge?: number
  /** When set, the item is hidden unless the current user holds this permission. */
  permission?: string
}

interface NavSection {
  section: string
  items: NavItem[]
}

const navItems = computed<any>(() => {
  if (auth.userRole === 'nep_admin') {
    return [
      {
        section: 'COORDINATION',
        items: [
          { to: '/admin/dashboard', label: 'Overview', icon: 'home' },
          { to: '/map', label: 'The Map', icon: 'map' },
          { to: '/adviser', label: 'The Adviser', icon: 'bolt' },
          { to: '/admin/programmes', label: 'Programme entries', icon: 'file' },
        ],
      },
      {
        section: 'ADMINISTRATION',
        items: visibleItems([
          { to: '/admin/taxonomy', label: 'Taxonomy data', icon: 'list', permission: 'taxonomy.view' },
          { to: '/admin/organization', label: 'Organization', icon: 'building', permission: 'organisations.view' },
          { to: '/admin/users', label: 'User Management', icon: 'users', permission: 'users.view' },
          { to: '/admin/roles', label: 'Roles', icon: 'shield', permission: 'roles.view' },
          { to: '/admin/permissions', label: 'Permissions', icon: 'lock', permission: 'permissions.view' },
          { to: '/policy', label: 'Policy library', icon: 'book' },
        ]),
      },
    ]
  }

  if (auth.userRole === 'nep_coordinator') {
    return [
      {
        section: 'COORDINATION',
        items: [
          { to: '/manager/dashboard', label: 'Overview', icon: 'home' },
          { to: '/map', label: 'The Map', icon: 'map' },
          { to: '/adviser', label: 'The Adviser', icon: 'bolt' },
          { to: '/admin/programmes', label: 'Programme entries', icon: 'file' },
        ],
      },
      {
        section: 'REFERENCE',
        items: [
        { to: '/policy', label: 'Policy library', icon: 'book' },
        ],
      },
    ]
  }

  return [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/policy', label: 'Policy library', icon: 'book' },
    { to: '/account', label: 'Organisation Profile', icon: 'building' },
  ]
})

// Derive a human-friendly title from the stored role
const portalTitle = computed(() => {
  const role = auth.userRole
  if (role === 'nep_admin') return 'NEP Admin Portal'
  if (role === 'nep_coordinator') return 'NEP Coordinator Portal'
  return 'NEP Member Portal'
})

// Capitalise the role label shown under the username
const roleLabel = computed(() => {
  const role = auth.userRole
  if (role === 'nep_admin') return 'Admin'
  if (role === 'nep_coordinator') return 'Coordinator'
  if (role === 'member_org') return 'Member'
  return role?.charAt(0).toUpperCase() + role?.slice(1) || ''
})

// Display name from the logged-in user object, fallback to role label
const displayName = computed(() => {
  const user = auth.currentUser as Record<string, unknown> | null
  return (user?.name as string) || roleLabel.value
})

function logout() {
  auth.logout()
}
</script>

<template>
  <div class="flex min-h-screen flex-col lg:flex-row">
    <!-- Mobile Top Bar Header -->
    <div
      class="lg:hidden flex items-center justify-between bg-teal-900 text-white px-5 py-3.5 sticky top-0 z-20 border-b border-white/10 shrink-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <img :src="nepLogo" alt="NEP Logo" class="h-8 w-auto max-w-[36px] object-contain shrink-0" />
        <div class="leading-snug min-w-0">
          <b class="font-lexend text-xs font-bold block text-white truncate">{{ portalTitle }}</b>
          <span class="text-[9px] text-white/50 block">Programme Mapping &amp; Advisory</span>
        </div>
      </div>
      <button type="button" @click="isSidebarOpen = !isSidebarOpen"
        class="text-white hover:text-white/80 transition-colors p-1" aria-label="Toggle navigation menu">
        <BaseIcon :name="isSidebarOpen ? 'x' : 'list'" size="22" />
      </button>
    </div>

    <!-- Backdrop Overlay for Mobile Drawer -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
      class="lg:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-xs transition-opacity duration-300"></div>

    <!-- Sidebar -->
    <aside :class="[
      'bg-teal-900 text-white flex flex-col shrink-0 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex',
      isSidebarOpen ? 'translate-x-0 fixed inset-y-0 left-0 w-64' : '-translate-x-full fixed inset-y-0 left-0 w-64 lg:relative lg:translate-x-0'
    ]">
      <div class="flex items-center gap-2.5 px-4 py-4.5 shrink-0 min-w-0">
        <img :src="nepLogo" alt="NEP Logo" class="h-10 w-auto max-w-[44px] object-contain shrink-0" />
        <div class="leading-tight min-w-0 flex-1">
          <b class="font-lexend text-[13px] font-bold block text-white tracking-tight truncate">{{ portalTitle }}</b>
          <span class="text-[10px] text-white/50 block mt-0.5">Programme Mapping &amp; Advisory</span>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-3.5 space-y-0.5">
        <template v-if="auth.userRole === 'nep_coordinator' || auth.userRole === 'nep_admin'">
          <div v-for="(section, sIndex) in navItems" :key="sIndex" class="mb-4">
            <template v-if="'section' in section">
              <div class="text-[10.5px] uppercase tracking-widest text-white/35 px-3 mb-2 mt-1 font-semibold">
                {{ section.section }}
              </div>
              <RouterLink
                v-for="item in section.items"
                :key="item.to"
                :to="item.to"
                @click="isSidebarOpen = false"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-teal-200/80 text-sm font-semibold hover:bg-white/8 hover:text-white transition-colors mb-0.5"
                active-class="!bg-white/15 !text-white"
              >
                <BaseIcon :name="item.icon" size="18" />
                <span class="flex-1">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                >
                  {{ item.badge }}
                </span>
              </RouterLink>
            </template>
          </div>
        </template>

        <template v-else>
          <div class="text-[10px] uppercase tracking-wider text-white/40 px-2.5 mb-1.5 font-semibold">
            WORKSPACE
          </div>
          <RouterLink
            v-for="item in navItems as NavItem[]"
            :key="item.to"
            :to="item.to"
            @click="isSidebarOpen = false"
            class="flex items-center gap-2.5 p-2 rounded-lg text-white/78 text-sm font-medium hover:bg-white/7 hover:text-white transition-colors"
            active-class="bg-white/14 text-white"
          >
            <BaseIcon :name="item.icon" />
            {{ item.label }}
          </RouterLink>

          <button
            type="button"
            @click="showExportAllModal = true; isSidebarOpen = false"
            class="w-full flex items-center gap-2.5 p-2 rounded-lg text-white/78 text-sm font-medium hover:bg-white/7 hover:text-white transition-colors cursor-pointer text-left"
          >
            <BaseIcon name="download" />
            <span>Export All Programmes</span>
          </button>
        </template>
      </nav>

      <div class="h-16 px-4 border-t border-white/10 flex items-center gap-3 shrink-0 select-none">
        <div
          class="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {{ displayName.slice(0, 2).toUpperCase() }}
        </div>
        <div class="overflow-hidden leading-tight flex-grow">
          <b class="text-xs block truncate w-24 text-white font-semibold">{{ displayName }}</b>
          <span class="text-[10px] text-white/50 block mt-0.5">{{ roleLabel }}</span>
        </div>
        <button @click="logout"
          class="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          style="min-width: 36px; min-height: 36px;" title="Log out">
          <BaseIcon name="logout" size="18" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 min-w-0 flex flex-col">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-14 lg:top-0 z-10">
        <div class="flex items-center gap-1 text-sm text-gray-500 w-full">
          <slot name="header" />
        </div>
        <NotificationBell v-if="auth.isAuthenticated" />
      </header>

      <!-- Page Content -->
      <div class="p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto flex-1">
        <slot />
      </div>

      <!-- PN Footer -->
      <footer class="flex h-16 border-t border-gray-200 bg-white px-6 items-center">
        <div class="max-w-[1400px] w-full mx-auto flex items-center justify-center gap-3">
          <span class="text-xs text-gray-500">Developed by Passerelles Numériques Cambodia</span>
          <img src="@/assets/images/logoes/PN-logo.png" alt="Passerelles Numériques Cambodia" class="w-8 h-8 object-contain"/>
        </div>
      </footer>
    </main>

    <OrganisationAllProgrammesReportModal
      :show="showExportAllModal"
      :organisation-id="(auth.currentUser as any)?.organisation_id ?? (auth.currentUser as any)?.organisation?.id ?? null"
      :organisation-name="(auth.currentUser as any)?.organisation?.name || 'Organisation'"
      @close="showExportAllModal = false"
    />
  </div>
</template>
