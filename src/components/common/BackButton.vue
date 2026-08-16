<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goBack() {
  if (authStore.userRole === 'nep_admin') {
    router.push({ name: 'admin-dashboard' })
  } else if (authStore.userRole === 'nep_coordinator') {
    router.push({ name: 'manager-dashboard' })
  } else {
    router.push({ name: 'dashboard' })
  }
}
</script>

<template>
  <button 
    @click="goBack"
    class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors cursor-pointer"
  >
    <BaseIcon name="arrowLeft" :size="16" />
    Back to dashboard
  </button>
</template>
