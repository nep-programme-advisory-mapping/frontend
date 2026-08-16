<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useToast } from '../utils/toast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-host">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="dismiss(t.id)">
        <BaseIcon :name="t.type === 'error' ? 'alert' : 'check'" :size="15" />
        <span>{{ t.message }}</span>
      </div>
    </div>
  </Teleport>
</template>
