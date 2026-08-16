<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'

const router = useRouter()
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <h2 class="text-base font-semibold text-gray-900 mb-1">Adviser Tools</h2>
    <p class="text-[13px] text-gray-500 mb-5">
      Access adviser submissions and manage adviser entity data.
    </p>
    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        @click="router.push('/adviser')"
        class="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg bg-[#0F5A4D] text-white text-[13px] font-semibold hover:bg-[#0C4A3F] transition-colors shadow-sm"
      >
        <BaseIcon name="bolt" size="18" />
        Adviser
      </button>
      <button
        type="button"
        @click="router.push('/adviser/new')"
        class="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg bg-[#0F5A4D] text-white text-[13px] font-semibold hover:bg-[#0C4A3F] transition-colors shadow-sm"
      >
        <BaseIcon name="plus" size="18" />
        Adviser Entity
      </button>
    </div>
  </div>
</template>