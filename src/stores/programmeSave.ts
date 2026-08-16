import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import router from '@/router'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import { BUDGET_BANDS } from '@/constants/programme'
import { useCategoriesStore } from './categories'
import { useTaxonomyStore } from './taxonomy'
import { useAuthStore } from './auth'
import { useMapStore } from './map'
import { useEntriesStore } from './entries.store'
import { useProgrammeIdentityStore } from './programmeIdentity'
import { useProgrammeActivitiesStore } from './programmeActivities'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useProgrammeAgreementsStore } from './programmeAgreements'
import { useProgrammeKeywordsStore } from './programmeKeywords'

// --- Shared taxonomy maps (module-level, not reactive — pure lookup tables) ---
export const dbIdToCodeMap = ref<Record<number, string>>({})
export const taxonomyMap = ref<Record<string, number>>({})

export async function ensureTaxonomyMaps() {
  const catsStore = useCategoriesStore()
  if (!catsStore.categories.length) await catsStore.loadCategories()
  const taxStore = useTaxonomyStore()
  if (!taxStore.categories.length) await taxStore.fetchTaxonomy()

  const allCats = [...(catsStore.categories || []), ...(taxStore.categories || [])]
  allCats.forEach((cat: any) => {
    const subcats = cat.subcategories || cat.subCategories || cat.sub_categories || []
    subcats.forEach((sub: any) => {
      const items = sub.items || sub.taxonomy_items || sub.taxonomyItems || []
      items.forEach((item: any) => {
        if (item.id && item.code) {
          dbIdToCodeMap.value[item.id] = item.code
          dbIdToCodeMap.value[Number(item.id)] = item.code
          taxonomyMap.value[item.code] = item.id
        }
      })
    })
  })
}

function formatUserFriendlyError(rawMsg: string): string {
  if (!rawMsg) return 'Please review your selections and try saving again.'
  const lower = rawMsg.toLowerCase()
  if (lower.includes('timeout') || lower.includes('econnaborted') || lower.includes('exceeded')) {
    return 'The request timed out. Please try saving again.'
  }
  return rawMsg
    .replace(/activities\.\d+\.education_level_ids(?:\.\d+)?/g, 'education levels')
    .replace(/activities\.\d+\.[\w.-]+/g, 'activity details')
    .replace(/provinces\.\d+\.[\w.-]+/g, 'geographic location')
}

function buildIdentityPayload(section1Data: any, shouldSubmit: boolean) {
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

function buildGeographyPayload(section3Data: any) {
  const rawOtherCountries = section3Data?.otherCountries
  const otherCountriesArray = typeof rawOtherCountries === 'string'
    ? rawOtherCountries.split(',').map((s: string) => s.trim()).filter(Boolean)
    : (Array.isArray(rawOtherCountries) ? rawOtherCountries : [])
  const provincesPayload = (section3Data?.provinceIds || []).map((pId: number) => ({
    province_id: pId,
    district_ids: section3Data.districts[pId] || [],
  }))
  return {
    provinces: provincesPayload,
    communes: section3Data?.communes || {},
    villages: section3Data?.villages || {},
    other_countries: otherCountriesArray,
  }
}

function buildActivitiesPayload(activitiesData: any, activitiesStore: any, section2Data: any) {
  const selectedSet = new Set<string>([
    ...(activitiesData?.selected || []),
    ...(activitiesStore.selected || []),
  ])
  const primarySet = new Set<string>([
    ...(activitiesData?.primary || []),
    ...(activitiesStore.primary || []),
  ])
  const primaryArray = Array.from(primarySet)

  const seenItemIds = new Set<number>()
  const mapped: any[] = []

  for (const code of selectedSet) {
    let dbId = taxonomyMap.value[code]
    if (!dbId) {
      const allCats = [
        ...(useCategoriesStore().categories || []),
        ...(useTaxonomyStore().categories || []),
      ]
      outer: for (const cat of allCats) {
        const subcats = cat.subcategories || cat.subCategories || cat.sub_categories || []
        for (const sub of subcats) {
          const items = sub.items || sub.taxonomy_items || sub.taxonomyItems || []
          for (const item of items) {
            if (item.code === code && item.id) {
              dbId = item.id
              taxonomyMap.value[code] = item.id
              break outer
            }
          }
        }
      }
    }
    if (!dbId) continue
    if (seenItemIds.has(dbId)) continue
    seenItemIds.add(dbId)

    const rawLevels = (
      activitiesStore.educationLevels?.[code] ||
      activitiesData?.educationLevels?.[code] ||
      section2Data?.educationLevels?.[code] || []
    ) as any[]
    const cleanLevels = Array.from(new Set(
      rawLevels.map((v: any) => parseInt(String(v), 10)).filter((n: number) => !isNaN(n) && n >= 1 && n <= 5)
    ))
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

function mapLocationsResponse(locations: any[]) {
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
      if (loc.district_id) {
        districts[loc.province_id] = [...(districts[loc.province_id] || []).filter((id: number) => id !== loc.district_id), loc.district_id]
      }
      if (loc.commune_id) {
        communes[loc.district_id] = [...(communes[loc.district_id] || []).filter((id: number) => id !== loc.commune_id), loc.commune_id]
      }
      if (loc.village_id) {
        villages[loc.commune_id] = [...(villages[loc.commune_id] || []).filter((id: number) => id !== loc.village_id), loc.village_id]
      }
    }
  }
  return { provinceIds, districts, communes, villages, otherCountries: otherCountries.join(', ') }
}

function mapActivitiesResponse(resActivities: any[]) {
  const inclusions: Record<string, any> = {}
  const levels: Record<string, number[]> = {}
  const otherText: Record<string, string> = {}
  for (const a of resActivities) {
    const code = a.code || a.activity_item?.code || a.activityItem?.code
      || dbIdToCodeMap.value[a.activity_item_id] || dbIdToCodeMap.value[a.activityItemId]
    if (!code) continue
    inclusions[code] = {
      hasInclusion: !!a.inclusion_group,
      dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : [],
    }
    levels[code] = Array.from(new Set(
      (a.activity_levels?.map((l: any) => Number(l.education_level_id)) || [])
        .filter((n: number) => typeof n === 'number' && !isNaN(n) && n > 0)
    ))
    if (a.other_text || a.otherText) {
      otherText[code] = a.other_text || a.otherText
    }
  }
  return { inclusions, levels, otherText }
}

export const useProgrammeSaveStore = defineStore('programmeSave', () => {
  const toast = useToast()
  const isSaving = ref(false)
  const saveStatus = ref<'unsaved' | 'saving' | 'saved'>('unsaved')
  const errors = ref<Record<string, string[]>>({})
  const submissionResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)
  let resultTimer: ReturnType<typeof setTimeout> | null = null
  let _onSaveRouteUpdate: (() => void) | null = null

  function onSaveRouteUpdate(cb: () => void) { _onSaveRouteUpdate = cb }

  function clearSubmissionResult() {
    if (resultTimer) clearTimeout(resultTimer)
    submissionResult.value = null
  }

  function showSubmissionResult(type: 'success' | 'error', message: string) {
    clearSubmissionResult()
    submissionResult.value = { type, message }
    resultTimer = setTimeout(() => { submissionResult.value = null }, 5000)
  }

  function clearError(field: string) {
    delete errors.value[field]
  }

  async function saveEntry(
    exitAfterSave: boolean,
    isSubmit = false,
    loadingAlreadySet = false,
    cachedOrgId: string | null,
    // Autosave passes silent=true: same backend calls, but no toast/redirect
    // spam on every background save — failures surface via autosaveStatus
    // in the header instead of an error toast per cycle.
    silent = false,
  ): Promise<boolean> {
    if (isSaving.value && !loadingAlreadySet) return false
    if (!loadingAlreadySet) isSaving.value = true
    saveStatus.value = 'saving'
    errors.value = {}
    clearSubmissionResult()

    const authStore = useAuthStore() as any
    const isStaff = ['nep_admin', 'nep_coordinator'].includes(authStore.userRole || '')
    const shouldSubmit = isSubmit && !isStaff

    const identityStore = useProgrammeIdentityStore()
    const activitiesStore = useProgrammeActivitiesStore()
    const geographyStore = useProgrammeGeographyStore()
    const agreementsStore = useProgrammeAgreementsStore()
    const keywordsStore = useProgrammeKeywordsStore()
    const { section1Data } = storeToRefs(identityStore)
    const { section2Data } = storeToRefs(activitiesStore)
    const { section3Data } = storeToRefs(geographyStore)
    const { section4Data } = storeToRefs(agreementsStore)
    const { keywordsData } = storeToRefs(keywordsStore)

    try {
      await ensureTaxonomyMaps()

      const isEditMode = !!section1Data.value.id || !!router.currentRoute.value.query.id
      const orgIdFromUrl = router.currentRoute.value.query.org_id
      const orgId = orgIdFromUrl ? String(orgIdFromUrl) : cachedOrgId

      if (!isEditMode && !orgId && isStaff) {
        isSaving.value = false
        return false
      }

      const payload = buildIdentityPayload(section1Data.value, shouldSubmit)
      const response = isEditMode
        ? await memberApi.updateProgrammeEntry(section1Data.value.id!, payload)
        : await memberApi.createProgrammeEntry(payload, orgId ?? undefined)

      sessionStorage.removeItem('new_programme_entry_draft')
      saveStatus.value = 'saved'

      const savedId = response.data?.data?.id ?? response.data?.id
      if (!savedId) throw new Error('Failed to retrieve programme entry ID after save.')
      section1Data.value.id = savedId

      const mappedAgreements = (section4Data.value || []).map((a: any) => ({
        id: a.id || null,
        counterpart_agency: a.counterpart_agency,
        nature: a.nature,
        status: a.status,
        institution_name: a.institution_name,
      }))

      const [agreementsResponse, geographyResponse, activitiesResponse] = await Promise.all([
        memberApi.saveGovernmentAgreements(savedId, mappedAgreements),
        memberApi.saveGeography(savedId, buildGeographyPayload(section3Data.value)),
        memberApi.saveActivities(savedId, buildActivitiesPayload(section2Data.value, activitiesStore, section2Data.value)),
        keywordsData.value.length > 0
          ? memberApi.saveKeywords(savedId, keywordsData.value.map((k: any) => String(k).trim()).filter(Boolean))
          : Promise.resolve(null),
      ])

      section4Data.value = agreementsResponse.data.data || []
      geographyStore.initFromPayload(mapLocationsResponse(geographyResponse.data.data || []))

      if (activitiesResponse && section2Data.value) {
        const { inclusions, levels, otherText } = mapActivitiesResponse(activitiesResponse.data.data || [])
        const updated = { ...section2Data.value, inclusions, educationLevels: levels, otherText }
        section2Data.value = updated
        activitiesStore.initFromPayload(updated)
      }

      const successMsg = response.data.message || 'Saved successfully!'
      if (!silent) {
        showSubmissionResult('success', successMsg)
        toast.success(successMsg)
      }

      // Always sync the ?id= query param, even when silent — this is what
      // stops a background autosave of a brand-new entry from creating a
      // second duplicate entry on the next autosave/refresh.
      const currentQuery = router.currentRoute.value.query
      if (!currentQuery.id || String(currentQuery.id) !== String(savedId)) {
        _onSaveRouteUpdate?.()
        await router.replace({ query: { ...currentQuery, id: String(savedId) } })
      }

      // Skip refreshing the dashboard entries list / map + any exit
      // navigation for silent autosaves — those are for keeping *other*
      // views in sync and aren't worth the extra requests on every
      // background save cycle. They still run on every manual save.
      if (!silent) {
        const entriesStore = useEntriesStore()
        let savedIsSubmitted = shouldSubmit
        try {
          const refreshedEntry = await entriesStore.refreshById(savedId)
          savedIsSubmitted = shouldSubmit || refreshedEntry?.isDraft === false
        } catch { /* coordinator may not have access to member entry list */ }
        entriesStore.refreshAfterSave(savedIsSubmitted).catch(() => {})
        useMapStore().fetchMapEntries()

        if (exitAfterSave) {
          if (isStaff) {
            router.push(`/admin/programmes?tab=${savedIsSubmitted ? 'submitted' : 'my-drafts'}`)
          } else {
            router.push(`/dashboard?tab=${savedIsSubmitted ? 'submitted' : 'draft'}`)
          }
        }
      }
      return true
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err?.message
      if (silent) {
        // Don't spam a toast every autosave cycle — the header's autosave
        // status indicator covers this instead.
        errors.value = err.response?.data?.errors || {}
        return false
      }
      if (err.response?.status === 422) {
        const firstField = err.response.data?.errors ? Object.values(err.response.data.errors)[0] : null
        const firstMsg = Array.isArray(firstField) ? firstField[0] : firstField
        toast.error(formatUserFriendlyError(firstMsg || serverMessage || 'Please correct the validation errors below.'))
        errors.value = err.response.data?.errors || {}
      } else {
        toast.error(formatUserFriendlyError(serverMessage || 'An unexpected error occurred while saving.'))
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    isSaving,
    saveStatus,
    errors,
    submissionResult,
    onSaveRouteUpdate,
    saveEntry,
    clearError,
    clearSubmissionResult,
  }
})
