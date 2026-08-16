import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useTaxonomyStore } from './taxonomy'
import { getMapEntries } from '@/api/map.api'
import { extractPrimaryActivityCodes } from '@/utils/activityHelpers'
import { useMapFilterOptions } from './mapFilters'
import type { MapViewFilters } from '@/types/map'

const DEFAULT_FILTERS: MapViewFilters = {
  category: '', level: '', inclusion: '', province: '', district: '',
  commune: '', village: '', counterpart: '', keyword: '',
}

export const useMapStore = defineStore('map', () => {
  const mapEntries = ref<any[]>([])
  const loading = ref(false)
  const filters = ref<MapViewFilters>({ ...DEFAULT_FILTERS })
  const page = ref(1)
  const pageSize = 20
  const sortKey = ref('name')
  const sortDir = ref<'asc' | 'desc'>('asc')

  const hasActiveFilters = computed(() => Object.values(filters.value).some(v => v !== ''))

  const filtered = computed(() =>
    mapEntries.value.filter(e => {
      const f = filters.value
      if (f.category && e.activities?.length) {
        const codes = e.activities.map((a: any) => a.activity_item?.code ?? a.code)
        if (!codes.some((c: string) => c.startsWith(f.category))) return false
      }
      if (f.level) {
        const levelIds = e.activities?.flatMap((a: any) => a.activity_levels?.map((l: any) => String(l.education_level_id ?? l)) ?? [])
        if (!levelIds?.includes(f.level)) return false
      }
      if (f.inclusion) {
        const groups = e.activities?.map((a: any) => a.inclusion_group).filter(Boolean)
        if (!groups?.includes(f.inclusion)) return false
      }
      if (f.province) {
        const provinces = e.provinces ?? e.locations?.map((l: any) => l.province?.province_name ?? l.province_name).filter(Boolean) ?? []
        if (!provinces.includes(f.province)) return false
      }
      if (f.district) {
        const districts = e.locations?.map((l: any) => l.district?.name ?? l.district_name).filter(Boolean) ?? []
        if (districts.length && !districts.includes(f.district)) return false
      }
      if (f.commune) {
        const communes = e.locations?.map((l: any) => l.commune?.name ?? l.commune_name).filter(Boolean) ?? []
        if (communes.length && !communes.includes(f.commune)) return false
      }
      if (f.village) {
        const villages = e.locations?.map((l: any) => l.village?.name ?? l.village_name).filter(Boolean) ?? []
        if (villages.length && !villages.includes(f.village)) return false
      }
      if (f.counterpart) {
        const agencies = e.government_agreements?.map((a: any) => a.counterpart_agency) ?? []
        if (!agencies.includes(f.counterpart)) return false
      }
      if (f.keyword) {
        const q = f.keyword.toLowerCase()
        const name = (e.programme_name ?? e.name ?? '').toLowerCase()
        const org = (e.organisation_name ?? e.organisation?.name ?? '').toLowerCase()
        if (!name.includes(q) && !org.includes(q)) return false
      }
      return true
    })
  )

  const sorted = computed(() => {
    const arr = [...filtered.value]
    const dir = sortDir.value === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (sortKey.value === 'budgetBand') return ((a.budget_band_id ?? 0) - (b.budget_band_id ?? 0)) * dir
      const va = (a.programme_name ?? a.name ?? '').toLowerCase()
      const vb = (b.programme_name ?? b.name ?? '').toLowerCase()
      return va < vb ? -dir : va > vb ? dir : 0
    })
    return arr
  })

  const paged = computed(() => sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize))
  const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize)))

  // Filter options + watchers + toApiFilters from composable
  const { provincesList, districtsList, communesList, villagesList, counterpartOptions, toApiFilters } =
    useMapFilterOptions(mapEntries, filters, hasActiveFilters, filtered)

  function primaryActivities(e: any): string[] { return extractPrimaryActivityCodes(e?.activities) }
  function formatBudget(band: string | null | undefined): string { return band || '—' }
  function clearFilters() { filters.value = { ...DEFAULT_FILTERS }; page.value = 1 }

  function toggleSort(key: string) {
    if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    else { sortKey.value = key; sortDir.value = 'asc' }
    page.value = 1
  }

  function goToPage(p: number) { if (p >= 1 && p <= totalPages.value) page.value = p }

  async function fetchMapEntries() {
    loading.value = true
    try {
      const geoStore = useProgrammeGeographyStore()
      const taxStore = useTaxonomyStore()
      const [entriesRes] = await Promise.all([getMapEntries(), taxStore.fetchTaxonomy(), geoStore.loadProvinces()])
      const raw = entriesRes.data?.data?.data ?? entriesRes.data?.data ?? entriesRes.data ?? []
      mapEntries.value = Array.isArray(raw) ? raw : []
    } catch {
      mapEntries.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    mapEntries, loading, filters, hasActiveFilters, page, pageSize, sortKey, sortDir,
    provincesList, districtsList, communesList, villagesList, counterpartOptions,
    filtered, sorted, paged, totalPages,
    toApiFilters, primaryActivities, formatBudget, clearFilters, toggleSort, goToPage, fetchMapEntries,
  }
})
