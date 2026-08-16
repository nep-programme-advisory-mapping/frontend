<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import ProgrammeDashboard from '@/components/programme/ProgrammeDashboard.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Dashboard" />
    </template>

    <ProgrammeDashboard />
  </AppShell>
</template>