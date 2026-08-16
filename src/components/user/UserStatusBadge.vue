<script setup lang="ts">
import BaseBadge from '@/components/common/BaseBadge.vue'
import type { UserStatus } from '@/types/user'

defineProps<{ status: UserStatus }>()
</script>

<template>
  <BaseBadge :tone="status === 'active' ? 'green' : 'gray'" dot>
    {{ status === 'active' ? 'Active' : 'Inactive' }}
  </BaseBadge>
</template>
