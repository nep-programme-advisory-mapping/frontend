<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import UserManagementPanel from '@/components/user/UserManagementPanel.vue'
import { usePermission } from '@/composables/usePermission'
import { useUsersAdminStore } from '@/stores/usersAdmin'

const { hasPermission } = usePermission()
const router = useRouter()
const store = useUsersAdminStore()

onMounted(async () => {
  if (!hasPermission('users.view')) {
    router.replace({ name: 'forbidden' })
    return
  }
  await Promise.all([
    store.usersComposable.fetchUsers(1),
    store.usersComposable.fetchOrganisations(),
  ])
})
</script>

<template>
  <AppShell>
    <!-- Breadcrumb -->
    <template #header>
      <HeaderBreadcrumb title="User Management" />
    </template>

    <UserManagementPanel />
  </AppShell>
</template>
