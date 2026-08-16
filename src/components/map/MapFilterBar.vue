<script setup lang="ts">
import { useMapStore } from '@/stores/map'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { EDUCATION_LEVELS, INCLUSION_GROUPS } from '@/constants/map'
import FilterSelect from './FilterSelect.vue'

const mapStore = useMapStore()
const taxonomyStore = useTaxonomyStore()
</script>

<template>
  <div class="bg-[var(--card)] p-4 rounded-[var(--radius)] border border-[var(--line)] shadow-sm mb-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 items-center">
      <FilterSelect v-model="mapStore.filters.category">
        <option value="">Activity category — any</option>
        <option v-for="c in taxonomyStore.categories" :key="c.code" :value="c.code">{{ c.code }} {{ c.label }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.level">
        <option value="">Education level — any</option>
        <option v-for="(label, key) in EDUCATION_LEVELS" :key="key" :value="key">{{ label }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.inclusion">
        <option value="">Inclusion group — any</option>
        <option v-for="(label, key) in INCLUSION_GROUPS" :key="key" :value="key">{{ label }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.province">
        <option value="">Province — any</option>
        <option v-for="p in mapStore.provincesList" :key="p" :value="p">{{ p }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.district" :disabled="!mapStore.filters.province">
        <option value="">District — any</option>
        <option v-for="d in mapStore.districtsList" :key="d" :value="d">{{ d }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.commune" :disabled="!mapStore.filters.district">
        <option value="">Commune — any</option>
        <option v-for="c in mapStore.communesList" :key="c" :value="c">{{ c }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.village" :disabled="!mapStore.filters.commune">
        <option value="">Village — any</option>
        <option v-for="v in mapStore.villagesList" :key="v" :value="v">{{ v }}</option>
      </FilterSelect>

      <FilterSelect v-model="mapStore.filters.counterpart">
        <option value="">Govt. counterpart — any</option>
        <option v-for="c in mapStore.counterpartOptions" :key="c" :value="c">{{ c }}</option>
      </FilterSelect>

      <div class="sm:col-span-2 md:col-span-3 lg:col-span-4 flex items-center gap-2 mt-1">
        <input
          type="text"
          v-model="mapStore.filters.keyword"
          placeholder="Keyword or organisation…"
          class="w-full border border-[var(--line)] rounded-xl px-3 py-2 text-xs font-medium bg-white text-[var(--ink-900)] placeholder-[var(--ink-300)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)]/20 focus:border-[var(--teal-600)] transition-all"
        />
        <button
          class="px-3 py-2 rounded-xl text-xs font-bold text-[var(--ink-500)] hover:text-[var(--ink-700)] hover:bg-[var(--bg)] transition-all cursor-pointer whitespace-nowrap shrink-0 border border-[var(--line)]/60"
          @click="mapStore.clearFilters"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>
