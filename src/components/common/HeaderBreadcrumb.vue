<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Reusable Header Breadcrumb component.
 *
 * Provides a standardized header breadcrumb across all views:
 * - Automatically derives the role prefix (Admin / Coordinator / NEP)
 * - Makes the role prefix & intermediate breadcrumbs interactive clickable links
 * - Renders single titles or multi-step breadcrumb arrays
 * - Supports an optional slot for right-aligned header actions
 */
const props = defineProps<{
  /** Main page title or item name */
  title?: string
  /** Explicit prefix override (e.g. "NEP", "Admin", "Coordinator") */
  prefix?: string
  /** Explicit prefix target URL override */
  prefixUrl?: string
  /** Optional array of breadcrumb items for multi-level navigation */
  crumbs?: string[]
}>()

const auth = useAuthStore()

/**
 * Computes the role-based prefix according to user role:
 * - nep_admin -> "Admin"
 * - nep_coordinator -> "Coordinator"
 * - member_org / default -> "NEP"
 */
const rolePrefix = computed(() => {
  if (props.prefix) return props.prefix
  const role = auth.userRole
  if (role === 'nep_admin') return 'Admin'
  if (role === 'nep_coordinator') return 'Coordinator'
  return 'NEP'
})

/**
 * Computes the default dashboard/landing route for the role prefix
 */
const prefixRoute = computed(() => {
  if (props.prefixUrl) return props.prefixUrl
  const role = auth.userRole
  if (role === 'nep_admin' || role === 'nep_coordinator') return '/admin/dashboard'
  return '/dashboard'
})

/**
 * Helper to determine router destination for intermediate breadcrumbs
 */
function getCrumbRoute(crumb: string) {
  const lower = crumb.toLowerCase().trim()
  if (lower.includes('programme') || lower.includes('entry') || lower.includes('entries')) {
    return auth.userRole === 'member_org' ? '/dashboard' : '/admin/programmes'
  }
  if (lower.includes('adviser')) return '/adviser'
  if (lower.includes('organization') || lower.includes('organisation')) {
    return auth.userRole === 'nep_admin' ? '/admin/organization' : '/organisation/profile'
  }
  if (lower.includes('coordinator')) return '/admin/coordinators'
  if (lower.includes('user')) return '/admin/users'
  if (lower.includes('taxonomy')) return '/admin/taxonomy'
  if (lower.includes('policy')) return '/policy'
  return prefixRoute.value
}
</script>

<template>
  <div class="flex items-center justify-between w-full min-w-0">
    <!-- Breadcrumb items -->
    <div class="flex items-center min-w-0 truncate text-sm">
      <router-link
        :to="prefixRoute"
        class="text-slate-500 hover:text-teal-700 font-medium shrink-0 transition-colors cursor-pointer hover:underline"
        title="Go to Dashboard"
      >
        {{ rolePrefix }}
      </router-link>
      
      <span class="mx-1.5 text-slate-300 select-none shrink-0">›</span>

      <!-- Multi-level crumbs -->
      <template v-if="crumbs && crumbs.length > 0">
        <template v-for="(crumb, idx) in crumbs" :key="idx">
          <span v-if="idx > 0" class="mx-1.5 text-slate-300 select-none shrink-0">›</span>
          <router-link
            v-if="idx < crumbs.length - 1"
            :to="getCrumbRoute(crumb)"
            class="text-slate-500 hover:text-teal-700 font-medium shrink-0 transition-colors cursor-pointer hover:underline truncate max-w-[200px]"
          >
            {{ crumb }}
          </router-link>
          <span
            v-else
            class="text-slate-800 font-semibold truncate"
          >
            {{ crumb }}
          </span>
        </template>
      </template>

      <!-- Single title -->
      <span v-else-if="title" class="text-slate-800 font-semibold truncate">
        {{ title }}
      </span>
    </div>

    <!-- Right-aligned header actions (slot) -->
    <div v-if="$slots.default || $slots.actions" class="ml-auto shrink-0 pl-2 flex items-center gap-2">
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </div>
</template>
