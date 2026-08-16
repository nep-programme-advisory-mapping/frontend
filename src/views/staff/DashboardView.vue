<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar.vue'
import ProgrammeDashboard from '@/components/programme/ProgrammeDashboard.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <DashboardTopBar />
    </template>

    <ProgrammeDashboard />
  </AppShell>
</template>
