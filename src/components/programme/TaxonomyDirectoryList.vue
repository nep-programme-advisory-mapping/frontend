<script setup lang="ts">
import { ref } from 'vue'
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy

const filterOpen = ref(false)

const filterOptions: { value: 'all' | 'active' | 'deprecated'; label: string }[] = [
  { value: 'all', label: 'All Activities' },
  { value: 'active', label: 'Active Only' },
  { value: 'deprecated', label: 'Deprecated Only' },
]

const currentFilterLabel = () =>
  filterOptions.find(o => o.value === store.statusFilter)?.label ?? 'All Activities'
</script>

<template>
  <div class="space-y-4">
    <!-- Search & Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
      <!-- Search input -->
      <div class="relative flex-1 min-w-0">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          v-model="store.searchInput"
          type="text"
          placeholder="Search directory by code or keyword..."
          class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 text-slate-700 bg-white"
        />
      </div>

      <div class="w-full sm:w-44 shrink-0 relative">
        <!-- Custom dropdown trigger -->
        <button
          type="button"
          @click="filterOpen = !filterOpen"
          class="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white cursor-pointer hover:border-teal-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          :class="filterOpen ? 'border-teal-500 ring-2 ring-teal-500/20' : ''"
        >
          <span>{{ currentFilterLabel() }}</span>
          <svg class="w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ml-1" :class="filterOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown panel -->
        <div
          v-if="filterOpen"
          class="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        >
          <!-- Click-outside overlay -->
          <div class="fixed inset-0 z-20" @click="filterOpen = false" />
          <div class="relative z-30">
            <button
              v-for="opt in filterOptions"
              :key="opt.value"
              type="button"
              class="w-full text-left px-3.5 py-2.5 text-sm transition-colors cursor-pointer"
              :class="store.statusFilter === opt.value
                ? 'bg-teal-600 text-white font-semibold'
                : 'text-slate-700 hover:bg-slate-50'"
              @click="store.statusFilter = opt.value; filterOpen = false"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsible Tree Table cards -->
    <div class="space-y-4">
      <div
        v-for="cat in store.filteredCategories"
        :key="cat.code"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <!-- Category Header -->
        <div
          class="flex items-center justify-between px-5 py-4 bg-slate-50/50 cursor-pointer select-none border-b border-slate-100"
          @click="store.toggleCategory(cat.code)"
        >
          <div class="flex items-center gap-3">
            <!-- Chevron -->
            <svg
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="store.isCategoryExpanded(cat.code) ? 'rotate-0' : '-rotate-90'"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>

            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 border border-teal-100 text-teal-800">Category {{ cat.code }}</span>
              
              <!-- Inline Rename for Category -->
              <div v-if="store.renameForm.key === `category-${cat.id}`" @click.stop class="flex items-center gap-2">
                <input
                  v-model="store.renameForm.label"
                  type="text"
                  @keydown.enter="store.saveRename(cat, 'category')"
                  @keydown.escape="store.cancelRename"
                  class="px-2.5 py-1 text-sm border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
                />
                <button @click="store.saveRename(cat, 'category')" class="px-3 py-1 bg-teal-800 text-white rounded-md text-xs font-bold hover:bg-teal-900 cursor-pointer shadow-xs">Save</button>
                <button @click="store.cancelRename" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 cursor-pointer border border-slate-200">Cancel</button>
              </div>
              <b v-else class="text-sm text-[var(--ink-900)] font-semibold transition-colors">{{ cat.label }}</b>
            </div>
          </div>

          <!-- Rename Category Pencil -->
          <div class="flex items-center gap-2" @click.stop>
            <button
              v-if="store.renameForm.key !== `category-${cat.id}`"
              @click="store.beginRename(cat, 'category')"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Rename Category"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Category Body (Subcategories List) -->
        <div v-if="store.isCategoryExpanded(cat.code)" class="bg-white divide-y divide-slate-100 border-t border-slate-100 animate-fade-in">
          <div
            v-for="sub in cat.subcategories"
            :key="sub.code"
            class="overflow-hidden"
          >
            <!-- Subcategory Header Row -->
            <div
              class="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer select-none bg-white"
              @click="store.toggleSubcategory(sub.code)"
            >
              <div class="flex items-center gap-2.5">
                <!-- Chevron -->
                <svg
                  class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                  :class="store.isSubcategoryExpanded(sub.code) ? 'rotate-0' : '-rotate-90'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>

                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-800">Subcategory {{ sub.code }}</span>
                  
                  <!-- Inline Rename for subcategory -->
                  <div v-if="store.renameForm.key === `subcategory-${sub.id}`" @click.stop class="flex items-center gap-2">
                    <input
                      v-model="store.renameForm.label"
                      type="text"
                      @keydown.enter="store.saveRename(sub, 'subcategory')"
                      @keydown.escape="store.cancelRename"
                      class="px-2.5 py-1 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
                    />
                    <button @click="store.saveRename(sub, 'subcategory')" class="px-2.5 py-0.5 bg-teal-800 text-white rounded-md text-xs font-bold hover:bg-teal-900 cursor-pointer shadow-xs">Save</button>
                    <button @click="store.cancelRename" class="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 cursor-pointer border border-slate-200">Cancel</button>
                  </div>
                  <span v-else class="text-xs text-slate-750 font-semibold">{{ sub.label }}</span>
                </div>
              </div>

              <!-- Rename Subcategory Pencil -->
              <div class="flex items-center gap-2" @click.stop>
                <button
                  v-if="store.renameForm.key !== `subcategory-${sub.id}`"
                  @click="store.beginRename(sub, 'subcategory')"
                  class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Rename Subcategory"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Subcategory Body (Items Table inside expanded subcategory) -->
            <div v-if="store.isSubcategoryExpanded(sub.code)" class="bg-slate-50/15 border-t border-slate-100 pl-8 pr-6 py-4 animate-fade-in overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[var(--line)]">
                    <th class="px-4 py-2 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider w-28">Activity Code</th>
                    <th class="px-4 py-2 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider">Activity Description</th>
                    <th class="px-4 py-2 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider w-24">Availability</th>
                    <th class="px-4 py-2 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider w-20">Version</th>
                    <th class="px-4 py-2 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider w-32">Programmes using</th>
                    <th class="px-4 py-2 text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="item in sub.items"
                    :key="item.code"
                    class="hover:bg-slate-100/40 transition-colors"
                  >
                    <td class="px-4 py-2.5 text-xs font-bold text-slate-550">{{ item.code }}</td>
                    <td class="px-4 py-2.5 text-xs text-slate-700">
                      <!-- Inline Rename for item -->
                      <div v-if="store.renameForm.key === `item-${item.id}`" class="flex items-center gap-2">
                        <input
                          v-model="store.renameForm.label"
                          type="text"
                          @keydown.enter="store.saveRename(item, 'item')"
                          @keydown.escape="store.cancelRename"
                          class="px-2.5 py-1 text-xs border border-slate-350 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800 w-full max-w-sm"
                        />
                        <button @click="store.saveRename(item, 'item')" class="px-2.5 py-0.5 bg-teal-800 text-white rounded-md text-xs font-bold hover:bg-teal-900 cursor-pointer shadow-xs">Save</button>
                        <button @click="store.cancelRename" class="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 cursor-pointer border border-slate-200">Cancel</button>
                      </div>
                      <div v-else class="flex items-center gap-2">
                        <span class="font-medium text-slate-850">{{ item.label }}</span>
                        <span v-if="item.note" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs select-none">{{ item.note }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-2.5 select-none">
                      <span
                        class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs border"
                        :class="item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'"
                      >
                        {{ item.status === 'active' ? 'Active' : 'Deprecated' }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 text-xs font-medium text-slate-500">{{ item.version }}</td>
                    <td class="px-4 py-2.5 text-xs font-bold text-slate-700">{{ item.usedCount }}</td>
                    <td class="px-4 py-2.5 text-right select-none">
                      <div class="inline-flex gap-1.5">
                        <button
                          v-if="store.renameForm.key !== `item-${item.id}`"
                          @click="store.beginRename(item, 'item')"
                          class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200 shadow-xs"
                          :disabled="taxonomy.loading"
                        >
                          Rename
                        </button>
                        <button
                          v-if="item.status === 'active'"
                          @click="store.askDeprecate(item, 'item')"
                          class="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 transition-colors cursor-pointer border border-rose-100 shadow-xs w-[74px] text-center"
                          :disabled="taxonomy.loading"
                        >
                          Deprecate
                        </button>
                        <button
                          v-else
                          @click="store.askRestore(item, 'item')"
                          class="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold text-emerald-700 transition-colors cursor-pointer border border-emerald-100 shadow-xs w-[74px] text-center"
                          :disabled="taxonomy.loading"
                        >
                          Reactive
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!sub.items.length">
                    <td colspan="6" class="px-4 py-6 text-center text-xs text-slate-400">No items found in this subcategory.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
