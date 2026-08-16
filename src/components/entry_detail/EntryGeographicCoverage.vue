<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
// @ts-ignore
import cambodiaMap from '@svg-maps/cambodia'

const PROVINCE_NAME_MAP: Record<string, string> = {
  // DB name → SVG map name
  'Takéo': 'Ta Keo',
  'Mondul Kiri': 'Mondulkiri',
  'Mondol Kiri': 'Mondulkiri',
  'Ratanak Kiri': 'Rattanakkiri',
  'Ratanakiri': 'Rattanakkiri',
  'Preah Sihanuk': 'Preah Sihanouk',
  'Sihanoukville': 'Preah Sihanouk',
  'Tbong Khmum': 'Tboung Khmum',
  'Tboung Khmum': 'Tboung Khmum',
}

function toMapName(name: string): string {
  return PROVINCE_NAME_MAP[name] ?? name
}

const props = defineProps<{
  locations: { label: string; provinceName: string }[]
  otherCountries: string
}>()

// Unique province names for map highlighting
const provinceNames = computed(() => [...new Set(props.locations.map(l => l.provinceName))])

const selectedProvince = ref<string | null>(null) // SVG map name
const currentViewBox = ref<string>(cambodiaMap.viewBox || '0 0 655 601')

// Unique province names for default view
const uniqueProvinceNames = computed(() => {
  const seen = new Set<string>()
  return props.locations
    .map(loc => loc.provinceName)
    .filter(name => { if (seen.has(name)) return false; seen.add(name); return true })
})

// Badges: show province names by default, filter to district/commune labels when a province is clicked
const visibleBadges = computed(() => {
  if (!selectedProvince.value) {
    return uniqueProvinceNames.value.map(name => ({ label: name, provinceName: name }))
  }
  const dbName = Object.entries(PROVINCE_NAME_MAP).find(([, v]) => v === selectedProvince.value)?.[0] ?? selectedProvince.value
  return props.locations
    .filter(loc => loc.provinceName === dbName)
    .filter(loc => loc.label !== loc.provinceName) // only sub-province labels
    .length
    ? props.locations.filter(loc => loc.provinceName === dbName && loc.label !== loc.provinceName)
    : props.locations.filter(loc => loc.provinceName === dbName) // fallback: province had no districts selected
})

function zoomTo(svgName: string, pathEl?: SVGPathElement | null) {
  selectedProvince.value = svgName
  const el = pathEl ?? document.getElementById(
    cambodiaMap.locations.find((l: any) => l.name === svgName)?.id ?? ''
  ) as SVGPathElement | null
  if (el?.getBBox) {
    const bbox = el.getBBox()
    const pad = 25
    currentViewBox.value = `${Math.max(0, bbox.x - pad)} ${Math.max(0, bbox.y - pad)} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
  }
}

function handleProvinceClick(loc: { id: string; name: string }, event: MouseEvent) {
  if (selectedProvince.value === loc.name) { resetZoom(); return }
  zoomTo(loc.name, event.currentTarget as SVGPathElement)
}

function resetZoom() {
  selectedProvince.value = null
  currentViewBox.value = cambodiaMap.viewBox || '0 0 655 601'
}

function selectProvinceByName(dbProvinceName: string) {
  const mapName = toMapName(dbProvinceName)
  if (selectedProvince.value === mapName) { resetZoom(); return }
  zoomTo(mapName)
}
</script>

<template>
  <BaseCard class="bg-white border-slate-100 shadow-sm relative overflow-hidden">
    <div class="section-title mt-0 flex items-center justify-between">
      <h3 class="text-slate-800 font-bold">Geographic coverage</h3>
    </div>

    <!-- Map Container -->
    <div class="h-[240px] rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 overflow-hidden relative group">
      <!-- Floating Glassmorphism Active Province Tag -->
      <div 
        v-if="selectedProvince" 
        class="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md text-xs font-semibold text-slate-800 animate-fade-in"
      >
        <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
        <span>{{ selectedProvince }}</span>
        <button 
          @click.stop="resetZoom" 
          class="ml-1 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
          title="Reset Zoom"
        >
          ✕
        </button>
      </div>

      <!-- Reset Zoom Floating Control -->
      <button 
        v-if="selectedProvince" 
        @click="resetZoom"
        class="absolute bottom-3 right-3 z-10 p-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:bg-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
        Reset Zoom
      </button>

      <!-- SVG Map -->
      <svg 
        :viewBox="currentViewBox" 
        class="w-full h-full drop-shadow-sm transition-all duration-500 ease-in-out"
      >
        <path
          v-for="loc in cambodiaMap.locations"
          :key="loc.id"
          :d="loc.path"
          :id="loc.id"
          :class="[
            provinceNames.map(toMapName).includes(loc.name) ? 'fill-teal-500 stroke-teal-600 hover:fill-teal-600' : 'fill-slate-200 stroke-white hover:fill-slate-300',
            selectedProvince === loc.name ? 'fill-teal-600 stroke-teal-800 ring-2 ring-teal-500' : ''
          ]"
          stroke-width="1.5"
          class="transition-all duration-300 cursor-pointer"
          @click="handleProvinceClick(loc, $event)"
        >
          <title>{{ loc.name }}</title>
        </path>
      </svg>
    </div>

    <!-- Badges: province names by default, districts/communes after clicking a province -->
    <div class="flex flex-wrap gap-1.5">
      <BaseBadge
        v-for="loc in visibleBadges"
        :key="loc.provinceName + loc.label"
        :tone="selectedProvince ? 'teal' : 'gray'"
        class="cursor-pointer transition-all hover:scale-105"
        @click="selectProvinceByName(loc.provinceName)"
      >
        {{ loc.label }}
      </BaseBadge>
    </div>

    <p v-if="otherCountries" class="text-xs text-slate-500 mt-3 font-medium">
      Also operates in: <span class="text-slate-700 font-semibold">{{ otherCountries }}</span>
    </p>
  </BaseCard>
</template>
