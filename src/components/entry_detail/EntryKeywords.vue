<script setup lang="ts">
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'

defineProps<{
  keywords: string[]
}>()
</script>

<template>
  <BaseCard class="mt-6 bg-white border-slate-100 shadow-sm relative overflow-hidden">
    <div class="section-title mt-0">
      <h3 class="text-slate-800 font-bold text-base">Keywords</h3>
    </div>
    <div class="flex flex-wrap gap-2" v-if="keywords.length">
      <span v-for="k in keywords" :key="k" class="inline-flex items-center px-5 py-1.5 rounded-lg text-[10px] font-medium bg-amber-50/80 text-amber-800 border border-amber-200/50 shadow-sm hover:bg-amber-100/50 hover:-translate-y-px transition-all">{{ k }}</span>
    </div>
    <div v-else class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
      <p class="text-sm text-slate-500 font-medium">No keywords recorded.</p>
    </div>
  </BaseCard>
</template>
