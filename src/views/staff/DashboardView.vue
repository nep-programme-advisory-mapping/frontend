<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import AppShell from '@/components/AppShell.vue'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar.vue'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader.vue'
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid.vue'
import CoverageListCard from '@/components/dashboard/CoverageListCard.vue'
import DashboardRecentActivity from '@/components/dashboard/DashboardRecentActivity.vue'

const router = useRouter()
const dash = useDashboardStore()

onMounted(() => dash.fetchDashboardData())
</script>

<template>
  <AppShell>
    <template #header>
      <DashboardTopBar />
    </template>

    <DashboardPageHeader />

    <DashboardKpiGrid />

    <!-- Coverage cards side by side -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <CoverageListCard
        title="Activity coverage by category"
        :items="dash.activityCoverage"
        :loading="dash.activityLoading"
        show-bar
      />

      <CoverageListCard
        title="Provincial coverage"
        subtitle="Top provinces by entry count"
        :items="dash.provincialCoverage"
        :loading="dash.provincialLoading"
        action-text="Open full map"
        @action="router.push('/map')"
      />
    </div>

    <DashboardRecentActivity class="mt-5" />
  </AppShell>
</template>
