<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import ProgrammeWizard from '@/components/programme/ProgrammeWizard.vue'

const route = useRoute()

const isEditing = computed(() => !!route.query.id)

const breadcrumbs = computed(() => {
  const actionLabel = isEditing.value ? 'Edit Programme Entry' : 'New Programme Entry'
  return ['Programme entries', actionLabel]
})
</script>

<template>
  <AppShell>
    <!-- Dynamic Header Breadcrumb Slot -->
    <template #header>
      <HeaderBreadcrumb :crumbs="breadcrumbs" />
    </template>

    <ProgrammeWizard />
  </AppShell>
</template>
