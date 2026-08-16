<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import AdviserSubmissionForm from '@/components/adviser/AdviserSubmissionForm.vue'

const router = useRouter()

function goBack() {
  router.push('/adviser')
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['The Adviser', 'Submit document']" />
    </template>

    <div class="pt-6 pb-12 max-w-4xl mx-auto space-y-6">
      <!-- Back button outside top above form -->
      <div>
        <button
          type="button"
          @click="goBack"
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0F5A4D] transition shadow-2xs cursor-pointer group"
        >
          <svg class="w-4 h-4 shrink-0 text-slate-600 group-hover:text-[#0F5A4D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span>Back to The Adviser</span>
        </button>
      </div>

      <AdviserSubmissionForm />
    </div>
  </AppShell>
</template>
