<script setup lang="ts">
import { formatBudget } from '@/utils/format'
import BaseCard from '@/components/common/BaseCard.vue'
import type { EntryDetail } from '@/types/entryDetail'

defineProps<{
  entry: EntryDetail
}>()
</script>

<template>
  <BaseCard class="bg-white border-slate-100 shadow-sm relative overflow-hidden">
    <div class="section-title mt-0">
      <h3 class="text-slate-800 font-bold">Programme identity</h3>
    </div>
    
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <!-- Start Year -->
      <div class="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-teal-600 transition-colors">Start Year</div>
        <div class="text-base font-semibold text-slate-800">{{ entry.startYear }}</div>
      </div>

      <!-- End Year -->
      <div class="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-teal-600 transition-colors">End Year</div>
        <div class="text-base font-semibold text-slate-800">{{ entry.endYear || 'Ongoing' }}</div>
      </div>

      <!-- Staff -->
      <div class="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-teal-600 transition-colors">Staff (FTE)</div>
        <div class="text-base font-semibold text-slate-800">{{ entry.staffFte ?? '—' }}</div>
      </div>

      <!-- Budget Band -->
      <div class="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-teal-600 transition-colors">Budget Band</div>
        <div class="text-xs sm:text-[13px] font-semibold text-slate-800 leading-tight break-words">{{ formatBudget(entry.budgetBand) }}</div>
      </div>

      <!-- Direct Beneficiaries -->
      <div class="col-span-2 sm:col-span-2 bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-teal-600 transition-colors">Direct Beneficiaries</div>
        <div class="text-base sm:text-lg font-semibold text-slate-800">
          {{ entry.directBeneficiaries ? '~' + entry.directBeneficiaries.toLocaleString() : '—' }}
          <span v-if="entry.directBeneficiaries" class="text-xs font-normal text-slate-400">/ yr</span>
        </div>
      </div>

      <!-- Indirect Beneficiaries -->
      <div class="col-span-2 sm:col-span-2 bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-teal-600 transition-colors">Indirect Beneficiaries</div>
        <div class="text-base sm:text-lg font-semibold text-slate-800">
          {{ entry.indirectBeneficiaries ? '~' + entry.indirectBeneficiaries.toLocaleString() : '—' }}
          <span v-if="entry.indirectBeneficiaries" class="text-xs font-normal text-slate-400">/ yr</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
