<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard.vue'

defineProps<{
  entries: any[]
  orgNameOf: (id: number) => string
  orgById: (id: number) => { initials: string } | null
}>()

defineEmits<{
  navigate: [id: string]
}>()
</script>

<template>
  <BaseCard v-if="entries.length" class="mt-4 col-span-full">
    <div class="section-title mt-0">
      <h3>Related entries</h3>
    </div>
    <div v-for="r in entries" :key="r.id" class="flex items-center gap-2.5 py-2 border-b border-dashed border-gray-200 cursor-pointer last:border-b-0"
      @click="$emit('navigate', r.id)">
      <div class="org-logo">{{ orgById(r.organisationId)?.initials }}</div>
      <div class="flex-1 min-w-0">
        <b class="text-xs block truncate hover:text-teal-800">{{
          r.name }}</b>
        <span class="text-xs text-gray-500">{{ orgNameOf(r.organisationId) }}</span>
      </div>
    </div>
  </BaseCard>
</template>
