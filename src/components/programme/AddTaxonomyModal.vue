<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy

const currentCategory = computed(() => {
  return taxonomy.categories.find(c => c.code === store.addForm.categoryCode)
})

const availableSubcategories = computed(() => {
  return currentCategory.value?.subcategories ?? []
})

// Auto-fill subcategory label if an existing subcategory code is chosen
watch(() => store.addForm.subcategoryCode, (newCode) => {
  if (!newCode) return
  const clean = newCode.trim().toLowerCase()
  const existing = availableSubcategories.value.find(s => s.code.toLowerCase() === clean)
  if (existing) {
    store.addForm.subcategoryLabel = existing.label
  }
})

// Compute predicted next item code (e.g., B3.8.02)
const predictedItemCode = computed(() => {
  if (!store.addForm.subcategoryCode) return ''
  const clean = store.addForm.subcategoryCode.trim().toLowerCase()
  const existingSub = availableSubcategories.value.find(s => s.code.toLowerCase() === clean)
  const count = existingSub ? existingSub.items.length + 1 : 1
  return `${store.addForm.subcategoryCode.trim().toUpperCase()}.${String(count).padStart(2, '0')}`
})

function onSubCategorySelect(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val === '__new__') {
    const catCode = store.addForm.categoryCode
    const nextSubNum = (availableSubcategories.value.length + 1)
    store.addForm.subcategoryCode = `${catCode}.${nextSubNum}`
    store.addForm.subcategoryLabel = ''
  } else if (val) {
    const selected = availableSubcategories.value.find(s => s.code === val)
    if (selected) {
      store.addForm.subcategoryCode = selected.code
      store.addForm.subcategoryLabel = selected.label
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="store.showAdd" class="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" @click.self="store.showAdd = false">
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
        <div>
          <h3 class="text-lg font-bold text-[var(--ink-900)]">Add custom activity</h3>
          <p class="text-xs text-slate-500 mt-0.5">Submit a custom taxonomy item for evaluation or review.</p>
        </div>
        
        <div class="space-y-3.5">
          <!-- Category -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">Category</label>
            <select v-model="store.addForm.categoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
              <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                {{ c.code }} · {{ c.label }}
              </option>
            </select>
          </div>

          <!-- Select Existing Sub-category -->
          <div v-if="availableSubcategories.length > 0" class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">Select Existing Sub-category</label>
            <select :value="store.addForm.subcategoryCode" @change="onSubCategorySelect" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
              <option value="">-- Choose Sub-category --</option>
              <option v-for="sub in availableSubcategories" :key="sub.code" :value="sub.code">
                {{ sub.code }} · {{ sub.label }} ({{ sub.items.length }} items)
              </option>
              <option value="__new__">+ Create new sub-category</option>
            </select>
          </div>
          
          <!-- Sub-category Code & Label inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">Sub-category code</label>
              <input type="text" v-model="store.addForm.subcategoryCode" placeholder="e.g. B3.8" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">Sub-category label</label>
              <input type="text" v-model="store.addForm.subcategoryLabel" placeholder="e.g. Financial support" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
            </div>
          </div>
          
          <!-- Item label & Predicted Code Preview -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700">Item label</label>
              <span v-if="predictedItemCode" class="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                Generated Code: {{ predictedItemCode }}
              </span>
            </div>
            <input type="text" v-model="store.addForm.label" placeholder="e.g. Activity item name" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 text-slate-700 bg-white" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer transition-colors shadow-xs" @click="store.showAdd = false">Cancel</button>
          <button class="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-xs" @click="store.submitAdd" :disabled="taxonomy.loading">
            {{ taxonomy.loading ? 'Submitting...' : 'Submit for review' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
