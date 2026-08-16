<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()
const taxonomy = store.taxonomy

const currentCategory = computed(() => {
  return taxonomy.categories.find(c => c.code === store.promoteForm.categoryCode)
})

const availableSubcategories = computed(() => {
  return currentCategory.value?.subcategories ?? []
})

watch(() => store.promoteForm.subcategoryCode, (newCode) => {
  if (!newCode) return
  const clean = newCode.trim().toLowerCase()
  const existing = availableSubcategories.value.find(s => s.code.toLowerCase() === clean)
  if (existing) {
    store.promoteForm.subcategoryLabel = existing.label
  }
})

function onSubCategorySelect(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val === '__new__') {
    const catCode = store.promoteForm.categoryCode
    const nextSubNum = (availableSubcategories.value.length + 1)
    store.promoteForm.subcategoryCode = `${catCode}.${nextSubNum}`
    store.promoteForm.subcategoryLabel = ''
  } else if (val) {
    const selected = availableSubcategories.value.find(s => s.code === val)
    if (selected) {
      store.promoteForm.subcategoryCode = selected.code
      store.promoteForm.subcategoryLabel = selected.label
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="store.promoteTarget" class="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" @click.self="store.promoteTarget = null">
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
        <div>
          <h3 class="text-lg font-bold text-[var(--ink-900)]">Promote to standard taxonomy</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Promote <span class="font-semibold italic text-slate-800">"{{ store.promoteTarget.text }}"</span> (reported by {{ store.promoteTarget.frequency }} organisations).
          </p>
        </div>

        <div class="space-y-3.5">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">Category <span class="text-red-500">*</span></label>
            <select v-model="store.promoteForm.categoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
              <option v-for="c in taxonomy.categories" :key="c.code" :value="c.code">
                {{ c.code }} · {{ c.label }}
              </option>
            </select>
          </div>

          <div v-if="availableSubcategories.length > 0" class="flex flex-col gap-1">
            <label class="text-xs font-bold text-slate-700">Select Existing Sub-category</label>
            <select :value="store.promoteForm.subcategoryCode" @change="onSubCategorySelect" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white">
              <option value="">-- Choose Sub-category --</option>
              <option v-for="sub in availableSubcategories" :key="sub.code" :value="sub.code">
                {{ sub.code }} · {{ sub.label }} ({{ sub.items.length }} items)
              </option>
              <option value="__new__">+ Create new sub-category</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">Sub-category code <span class="text-red-500">*</span></label>
              <input type="text" v-model="store.promoteForm.subcategoryCode" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-slate-700">Sub-category label <span class="text-red-500">*</span></label>
              <input type="text" v-model="store.promoteForm.subcategoryLabel" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 bg-white" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button class="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer transition-colors shadow-xs" @click="store.promoteTarget = null">Cancel</button>
          <button class="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-xs" @click="store.confirmPromote" :disabled="taxonomy.loading">Promote</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
