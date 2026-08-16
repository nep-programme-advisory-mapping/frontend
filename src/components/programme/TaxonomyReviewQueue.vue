<script setup lang="ts">
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'
import StatusBadge from '@/components/common/StatusBadge.vue'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy
</script>

<template>
  <div class="space-y-4">
    <!-- Desktop Table View (visible on >= md) -->
    <div class="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200 select-none">
              <th class="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Free-Text Entry</th>
              <th class="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48">Suggested Category</th>
              <th class="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-40">Frequency</th>
              <th class="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-36">Status</th>
              <th class="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="entry in taxonomy.otherQueue"
              :key="entry.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 text-[13px] font-semibold text-slate-800">
                <span>{{ entry.text }}</span>
              </td>
              <td class="px-6 py-4 text-xs font-bold text-slate-550">
                {{ entry.suggestedCategory }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-700">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-55/60 text-slate-700 border border-slate-200/80 select-none">
                  {{ entry.frequency }} Org{{ entry.frequency === 1 ? '' : 's' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <StatusBadge
                  :label="entry.status === 'pending' ? 'Pending Review' : entry.status === 'promoted' ? 'Promoted' : 'Dismissed'"
                  :variant="entry.status === 'pending' ? 'warning' : entry.status === 'promoted' ? 'success' : 'neutral'"
                />
              </td>
              <td class="px-6 py-4 text-right">
                <div v-if="entry.status === 'pending'" class="inline-flex gap-2 justify-end">
                  <button
                    @click="store.openPromote(entry)"
                    class="px-3.5 py-1.5 bg-teal-800 text-white hover:bg-teal-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Promote
                  </button>
                  <button
                    @click="store.dismiss(entry)"
                    class="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!taxonomy.otherQueue.length">
              <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-400">No review queue entries yet.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="taxonomy.loading && !taxonomy.otherQueue.length" class="text-center p-12 text-sm text-slate-400">
        Loading review queue...
      </div>
    </div>

    <!-- Mobile Card View (visible on < md) -->
    <div class="md:hidden space-y-3.5">
      <div
        v-for="entry in taxonomy.otherQueue"
        :key="entry.id"
        class="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:border-slate-300 transition-colors space-y-3"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1 min-w-0">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Free-Text Entry</span>
            <div class="text-[13px] font-semibold text-slate-800 truncate">{{ entry.text }}</div>
          </div>
          <StatusBadge
            :label="entry.status === 'pending' ? 'Pending Review' : entry.status === 'promoted' ? 'Promoted' : 'Dismissed'"
            :variant="entry.status === 'pending' ? 'warning' : entry.status === 'promoted' ? 'success' : 'neutral'"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 border-t border-slate-100/60 pt-3">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Suggested Category</span>
            <span class="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded">
              {{ entry.suggestedCategory }}
            </span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Frequency</span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200/80 select-none">
              {{ entry.frequency }} Org{{ entry.frequency === 1 ? '' : 's' }}
            </span>
          </div>
        </div>

        <div v-if="entry.status === 'pending'" class="flex items-center gap-2 border-t border-slate-100/60 pt-3">
          <button
            @click="store.openPromote(entry)"
            class="flex-grow py-2 bg-teal-800 text-white hover:bg-teal-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
          >
            Promote
          </button>
          <button
            @click="store.dismiss(entry)"
            class="flex-grow py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 text-center"
          >
            Dismiss
          </button>
        </div>
      </div>
      <div v-if="taxonomy.loading && !taxonomy.otherQueue.length" class="text-center p-8 text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
        Loading review queue...
      </div>
      <div v-else-if="!taxonomy.otherQueue.length" class="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        No review queue entries yet.
      </div>
    </div>

    <p class="text-[11px] text-slate-400 mt-2 px-1 leading-relaxed">
      Review queue entries are gathered from free-text "Other" field reports. Items used frequently are prime candidates for promotion to standard taxonomy during the annual review.
    </p>
  </div>
</template>
