<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import OrganisationManagementPanel from '@/components/organisation/OrganisationManagementPanel.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Organization" />
    </template>

    <OrganisationManagementPanel />
  </AppShell>
</template>
