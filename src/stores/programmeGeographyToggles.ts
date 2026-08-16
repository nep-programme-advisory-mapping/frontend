import type { Ref } from 'vue'

export function useGeographyToggles(
  provinceIds: Ref<number[]>,
  districts: Ref<Record<number, number[]>>,
  communes: Ref<Record<number, number[]>>,
  villages: Ref<Record<number, number[]>>,
  expandedProvinces: Ref<Set<number>>,
  expandedDistricts: Ref<Set<number>>,
  expandedCommunes: Ref<Set<number>>,
  fetchDistricts: (id: number) => void,
  fetchCommunes: (id: number) => void,
  fetchVillages: (id: number) => void,
) {
  function toggleProvince(provinceId: number) {
    const idx = provinceIds.value.indexOf(provinceId)
    if (idx === -1) {
      provinceIds.value.push(provinceId)
    } else {
      provinceIds.value.splice(idx, 1)
      ;(districts.value[provinceId] || []).forEach(did => {
        ;(communes.value[did] || []).forEach(cid => { delete villages.value[cid] })
        delete communes.value[did]
      })
      delete districts.value[provinceId]
      const next = new Set(expandedProvinces.value)
      next.delete(provinceId)
      expandedProvinces.value = next
    }
  }

  function toggleDistrictVisibility(provinceId: number) {
    const next = new Set<number>()
    if (!expandedProvinces.value.has(provinceId)) { next.add(provinceId); fetchDistricts(provinceId) }
    expandedProvinces.value = next
  }

  function toggleDistrict(provinceId: number, districtId: number) {
    const arr = districts.value[provinceId] ?? []
    if (!arr.includes(districtId)) {
      districts.value = { ...districts.value, [provinceId]: [...arr, districtId] }
    } else {
      ;(communes.value[districtId] || []).forEach(cid => delete villages.value[cid])
      delete communes.value[districtId]
      const next = new Set(expandedDistricts.value); next.delete(districtId); expandedDistricts.value = next
      districts.value = { ...districts.value, [provinceId]: arr.filter(id => id !== districtId) }
    }
  }

  function toggleCommuneVisibility(districtId: number) {
    const next = new Set<number>()
    if (!expandedDistricts.value.has(districtId)) { next.add(districtId); fetchCommunes(districtId) }
    expandedDistricts.value = next
  }

  function toggleCommune(districtId: number, communeId: number) {
    const arr = communes.value[districtId] ?? []
    if (!arr.includes(communeId)) {
      communes.value = { ...communes.value, [districtId]: [...arr, communeId] }
    } else {
      delete villages.value[communeId]
      const next = new Set(expandedCommunes.value); next.delete(communeId); expandedCommunes.value = next
      communes.value = { ...communes.value, [districtId]: arr.filter(id => id !== communeId) }
    }
  }

  function toggleVillageVisibility(communeId: number) {
    const next = new Set<number>()
    if (!expandedCommunes.value.has(communeId)) { next.add(communeId); expandedCommunes.value = next; fetchVillages(communeId) }
    else expandedCommunes.value = next
  }

  function toggleVillage(communeId: number, villageId: number) {
    const arr = villages.value[communeId] ?? []
    villages.value = { ...villages.value, [communeId]: arr.includes(villageId) ? arr.filter(id => id !== villageId) : [...arr, villageId] }
  }

  return { toggleProvince, toggleDistrictVisibility, toggleDistrict, toggleCommuneVisibility, toggleCommune, toggleVillageVisibility, toggleVillage }
}
