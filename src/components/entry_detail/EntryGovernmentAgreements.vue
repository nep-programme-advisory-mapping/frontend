<script setup lang="ts">
import { AGREEMENT_STATUS } from '@/utils/format'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { DetailGovernmentAgreement } from '@/types/entryDetail'

defineProps<{
  agreements: DetailGovernmentAgreement[]
}>()
</script>

<template>
  <BaseCard class="mt-6 bg-white border-slate-100 shadow-sm relative overflow-hidden">
    <div class="section-title mt-0">
      <h3 class="text-slate-800 font-bold">Government agreements</h3>
    </div>
    
    <div class="bg-slate-50/50 rounded-xl border border-slate-100/80 overflow-hidden" v-if="agreements.length">
      <table class="w-full text-sm text-left border-collapse">
        <thead>
          <tr class="bg-slate-100/50 border-b border-slate-100">
            <th class="px-5 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Counterpart</th>
            <th class="px-5 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Nature</th>
            <th class="px-5 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-transparent">
          <tr v-for="(g, idx) in agreements" :key="idx" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-4 align-top">
              <div class="font-semibold text-slate-800">{{ g.counterpart }}</div>
              <div v-if="g.institution" class="text-xs text-slate-500 mt-0.5">{{ g.institution }}</div>
            </td>
            <td class="px-5 py-4 align-top">
              <span class="inline-flex items-center text-slate-700 bg-slate-100/70 px-2.5 py-1 rounded-md text-xs font-medium">{{ g.nature }}</span>
            </td>
            <td class="px-5 py-4 align-top">
              <BaseBadge :tone="g.status === 'active' ? 'green' : g.status === 'expired' ? 'red' : 'amber'" class="shadow-sm border border-slate-100/50">{{
                AGREEMENT_STATUS[g.status] }}</BaseBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
      <p class="text-sm text-slate-500 font-medium">No government agreements recorded for this entry.</p>
    </div>
  </BaseCard>
</template>
