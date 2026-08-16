<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <!-- Icon -->
      <div
        class="mx-auto w-20 h-20 rounded-2xl bg-red-50 border border-red-100
               flex items-center justify-center text-red-400 mb-6"
      >
        <BaseIcon name="shield" :size="36" />
      </div>

      <!-- Code -->
      <p class="text-[11px] font-bold uppercase tracking-widest text-[var(--ink-400)] mb-2">
        Error 403
      </p>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-[var(--ink-900)] mb-3">Access Denied</h1>

      <!-- Message -->
      <p class="text-sm text-[var(--ink-500)] leading-relaxed mb-8">
        You don't have permission to view this page.
        Please contact your administrator if you believe this is a mistake.
      </p>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <button class="btn btn-secondary" @click="router.back()">
          <BaseIcon name="arrowLeft" :size="14" />
          Go Back
        </button>
        <button class="btn btn-primary" @click="router.push('/dashboard')">
          Dashboard
        </button>
      </div>
    </div>
  </div>
</template>
