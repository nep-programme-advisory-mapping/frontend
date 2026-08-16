<template>
  <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-[-0.02em] m-0"> {{ title }}</h1>
      <p class="text-[13px] text-[var(--ink-400)] mt-1">Landscape of NGO education activity across 10 member organisations, current as of today.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const title = computed(() => {
  if (auth.userRole === 'member_org') return 'Overview'
  return auth.currentUser
    ? `${(auth.currentUser as any).name?.split(' ')[0] ?? 'Staff'}'s overview`
    : 'Overview'
})
</script>
