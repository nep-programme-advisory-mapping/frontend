import { computed, watch, type Ref } from 'vue'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useTaxonomyStore } from './taxonomy'
import type { MapViewFilters } from '@/types/map'
import type { MapFilters } from '@/types/map'

export function useMapFilterOptions(mapEntries: Ref<any[]>, filters: Ref<MapViewFilters>, hasActiveFilters: Ref<boolean>, filtered: Ref<any[]>) {
  const geographyStore = computed(() => useProgrammeGeographyStore())
  const taxonomyStore = computed(() => useTaxonomyStore())

  const provinceIdByName = computed(() => {
    const map: Record<string, number> = {}
    for (const p of geographyStore.value.provinces) map[p.province_name] = p.id
    return map
  })

  const provincesList = computed(() => geographyStore.value.provinces.map(p => p.province_name))

  const districtsList = computed(() => {
    const provName = filters.value.province
    const distSet = new Set<string>()
    for (const e of mapEntries.value)
      for (const l of e.locations || [])
        if (!provName || l.province?.province_name === provName || l.province_name === provName) {
          const d = l.district?.name ?? l.district_name
          if (d) distSet.add(d)
        }
    if (provName) {
      const pId = provinceIdByName.value[provName]
      if (pId) for (const d of geographyStore.value.districtsCache[pId] || []) if (d.name) distSet.add(d.name)
    } else {
      for (const list of Object.values(geographyStore.value.districtsCache))
        for (const d of list) if (d.name) distSet.add(d.name)
    }
    return [...distSet].sort()
  })

  const communesList = computed(() => {
    const { province: provName, district: distName } = filters.value
    const commSet = new Set<string>()
    for (const e of mapEntries.value)
      for (const l of e.locations || []) {
        const matchProv = !provName || l.province?.province_name === provName || l.province_name === provName
        const matchDist = !distName || l.district?.name === distName || l.district_name === distName
        if (matchProv && matchDist) { const c = l.commune?.name ?? l.commune_name; if (c) commSet.add(c) }
      }
    return [...commSet].sort()
  })

  const villagesList = computed(() => {
    const { province: provName, district: distName } = filters.value
    const vilSet = new Set<string>()
    for (const e of mapEntries.value)
      for (const l of e.locations || []) {
        const matchProv = !provName || l.province?.province_name === provName || l.province_name === provName
        const matchDist = !distName || l.district?.name === distName || l.district_name === distName
        if (matchProv && matchDist) { const v = l.village?.name ?? l.village_name; if (v) vilSet.add(v) }
      }
    for (const list of Object.values(geographyStore.value.villagesCache))
      for (const v of list) if (v.name) vilSet.add(v.name)
    return [...vilSet].sort()
  })

  const counterpartOptions = computed(() => {
    const agencies = mapEntries.value.flatMap((e: any) => e.government_agreements?.map((a: any) => a.counterpart_agency) ?? [])
    return [...new Set(agencies)].filter(Boolean)
  })

  // Cascading watchers
  watch(() => filters.value.province, (newVal, oldVal) => {
    if (newVal !== oldVal) { filters.value.district = ''; filters.value.commune = ''; filters.value.village = '' }
    if (newVal) { const pId = provinceIdByName.value[newVal]; if (pId) geographyStore.value.fetchDistricts(pId) }
  })
  watch(() => filters.value.district, (newVal, oldVal) => {
    if (newVal !== oldVal) { filters.value.commune = ''; filters.value.village = '' }
    if (newVal) {
      for (const list of Object.values(geographyStore.value.districtsCache)) {
        const dist = list.find(d => d.name === newVal)
        if (dist) { geographyStore.value.fetchCommunes(dist.id); break }
      }
    }
  })
  watch(() => filters.value.commune, (newVal, oldVal) => {
    if (newVal !== oldVal) filters.value.village = ''
    if (newVal) {
      for (const list of Object.values(geographyStore.value.communesCache)) {
        const commune = list.find(c => c.name === newVal)
        if (commune) { geographyStore.value.fetchVillages(commune.id); break }
      }
    }
  })

  function toApiFilters(): MapFilters {
    const f = filters.value
    const params: any = {}

    if (hasActiveFilters.value) {
      const ids = filtered.value.map((e: any) => e.id).filter(Boolean)
      if (ids.length) {
        params.entry_ids = ids.join(',')
        params.ids = ids.join(',')
        params['entry_ids[]'] = ids
        params['ids[]'] = ids
      } else {
        params.entry_ids = '0'
        params.ids = '0'
      }
    }

    if (f.province) {
      let provId = provinceIdByName.value[f.province] || null
      if (!provId) {
        const found = geographyStore.value.provinces.find((p: any) => p.province_name === f.province || p.name === f.province)
        if (found) provId = found.id
      }
      if (provId) params.province_id = provId
    }
    if (f.district) {
      for (const list of Object.values(geographyStore.value.districtsCache)) {
        const match = list.find((d: any) => d.name === f.district)
        if (match) { params.district_id = match.id; break }
      }
    }
    if (f.commune) {
      for (const list of Object.values(geographyStore.value.communesCache)) {
        const match = list.find((c: any) => c.name === f.commune)
        if (match) { params.commune_id = match.id; break }
      }
    }
    if (f.category) {
      const catMatch = taxonomyStore.value.categories.find((c: any) => c.code === f.category || c.category_name === f.category)
      if (catMatch) params.category_id = catMatch.id
    }
    if (f.level) params.education_level_id = Number(f.level)
    if (f.inclusion) {
      params.inclusion_group = f.inclusion
      params.inclusion_type = f.inclusion
    }
    if (f.keyword) {
      params.keyword = f.keyword
      params.search = f.keyword
      params.q = f.keyword
    }
    if (f.counterpart) params.agreement_counterpart_type = f.counterpart

    return params as MapFilters
  }

  return { provincesList, districtsList, communesList, villagesList, counterpartOptions, provinceIdByName, toApiFilters }
}
