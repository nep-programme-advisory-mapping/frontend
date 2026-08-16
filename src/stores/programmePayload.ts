import { BUDGET_BANDS } from '@/constants/programme'
import { dbIdToCodeMap, taxonomyMap } from './programmeSave'
import { useCategoriesStore } from './categories'
import { useTaxonomyStore } from './taxonomy'

export function buildIdentityPayload(section1Data: any, shouldSubmit: boolean) {
  const payload: any = {
    programme_name: section1Data.name,
    start_year: section1Data.startYear,
    end_year: section1Data.isOngoing ? null : section1Data.endYear,
    ongoing: section1Data.isOngoing,
    method: section1Data.method || null,
    verified_date: section1Data.verifiedDate || null,
    is_submitted: shouldSubmit,
  }
  if (section1Data.fteStaff !== null && String(section1Data.fteStaff) !== '')
    payload.fte_staff = Number(section1Data.fteStaff)
  if (section1Data.budgetBand)
    payload.budget_band_id = BUDGET_BANDS.indexOf(section1Data.budgetBand) + 1
  if (section1Data.directBeneficiaries !== null && String(section1Data.directBeneficiaries) !== '')
    payload.direct_beneficiaries = Number(section1Data.directBeneficiaries)
  if (section1Data.indirectBeneficiaries !== null && String(section1Data.indirectBeneficiaries) !== '')
    payload.indirect_beneficiaries = Number(section1Data.indirectBeneficiaries)
  return payload
}

export function buildGeographyPayload(section3Data: any) {
  const rawOther = section3Data?.otherCountries
  const otherCountriesArray = typeof rawOther === 'string'
    ? rawOther.split(',').map((s: string) => s.trim()).filter(Boolean)
    : (Array.isArray(rawOther) ? rawOther : [])
  return {
    provinces: (section3Data?.provinceIds || []).map((pId: number) => ({
      province_id: pId,
      district_ids: section3Data.districts[pId] || [],
    })),
    communes: section3Data?.communes || {},
    villages: section3Data?.villages || {},
    other_countries: otherCountriesArray,
  }
}

export function buildActivitiesPayload(activitiesData: any, activitiesStore: any, section2Data: any) {
  const selectedSet = new Set<string>([
    ...(activitiesData?.selected || []),
    ...(activitiesStore.selected || []),
  ])
  const primaryArray = Array.from(new Set<string>([
    ...(activitiesData?.primary || []),
    ...(activitiesStore.primary || []),
  ]))
  const seenItemIds = new Set<number>()
  const mapped: any[] = []

  for (const code of selectedSet) {
    let dbId = taxonomyMap.value[code]
    if (!dbId) {
      const allCats = [...(useCategoriesStore().categories || []), ...(useTaxonomyStore().categories || [])]
      outer: for (const cat of allCats) {
        const subcats = cat.subcategories || cat.subCategories || cat.sub_categories || []
        for (const sub of subcats) {
          for (const item of (sub.items || sub.taxonomy_items || sub.taxonomyItems || [])) {
            if (item.code === code && item.id) { dbId = item.id; taxonomyMap.value[code] = item.id; break outer }
          }
        }
      }
    }
    if (!dbId || seenItemIds.has(dbId)) continue
    seenItemIds.add(dbId)

    const rawLevels = (activitiesStore.educationLevels?.[code] || activitiesData?.educationLevels?.[code] || section2Data?.educationLevels?.[code] || []) as any[]
    const cleanLevels = Array.from(new Set(rawLevels.map((v: any) => parseInt(String(v), 10)).filter((n: number) => !isNaN(n) && n >= 1 && n <= 5)))
    const inc = activitiesData?.inclusions?.[code] || activitiesStore.inclusions?.[code] || section2Data?.inclusions?.[code]
    const otherVal = activitiesStore.otherText?.[code] || activitiesData?.otherText?.[code] || section2Data?.otherText?.[code]
    const act: any = {
      activity_item_id: dbId,
      is_primary: primaryArray.includes(code),
      education_level_ids: cleanLevels,
      source: 'human_entered',
    }
    if (otherVal && typeof otherVal === 'string' && otherVal.trim()) {
      act.other_text = otherVal.trim()
    }
    if (inc?.hasInclusion && inc.dimensions?.[0]) {
      act.inclusion_group = inc.dimensions[0].group
      act.inclusion_type = inc.dimensions[0].type
    }
    mapped.push(act)
  }
  return mapped
}

export function mapLocationsResponse(locations: any[]) {
  const provinceIds: number[] = []
  const districts: Record<number, number[]> = {}
  const communes: Record<number, number[]> = {}
  const villages: Record<number, number[]> = {}
  const otherCountries: string[] = []

  for (const loc of locations) {
    if (loc.country) {
      otherCountries.push(loc.country)
    } else if (loc.province_id) {
      if (!provinceIds.includes(loc.province_id)) provinceIds.push(loc.province_id)
      if (loc.district_id) districts[loc.province_id] = [...new Set([...(districts[loc.province_id] || []), loc.district_id])]
      if (loc.commune_id) communes[loc.district_id] = [...new Set([...(communes[loc.district_id] || []), loc.commune_id])]
      if (loc.village_id) villages[loc.commune_id] = [...new Set([...(villages[loc.commune_id] || []), loc.village_id])]
    }
  }
  return { provinceIds, districts, communes, villages, otherCountries: otherCountries.join(', ') }
}

export function mapActivitiesResponse(resActivities: any[]) {
  const inclusions: Record<string, any> = {}
  const levels: Record<string, number[]> = {}
  for (const a of resActivities) {
    const code = a.code || a.activity_item?.code || a.activityItem?.code
      || dbIdToCodeMap.value[a.activity_item_id] || dbIdToCodeMap.value[a.activityItemId]
    if (!code) continue
    inclusions[code] = {
      hasInclusion: !!a.inclusion_group,
      dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : [],
    }
    levels[code] = Array.from(new Set(
      (a.activity_levels?.map((l: any) => Number(l.education_level_id)) || []).filter((n: number) => !isNaN(n) && n > 0)
    ))
  }
  return { inclusions, levels }
}
