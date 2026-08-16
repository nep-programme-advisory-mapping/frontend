import { defineStore } from 'pinia'
import { ref } from 'vue'
import { memberApi } from '@/api/member.api'
import { unwrapData } from '@/utils/apiHelpers'
import { useProgrammeActivitiesStore } from './programmeActivities'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useProgrammeAgreementsStore } from './programmeAgreements'
import { useProgrammeKeywordsStore } from './programmeKeywords'
import { useProgrammeIdentityStore } from './programmeIdentity'
import { useCategoriesStore } from './categories'
import { BUDGET_BANDS } from '@/constants/programme'

export const useAiAutofillStore = defineStore('aiAutofill', () => {
  const isRunning = ref(false)
  const error = ref('')
  const success = ref(false)

  const text = ref('')
  const url = ref('')
  const pendingFile = ref<File | null>(null)
  const uploadedFileName = ref('')
  const isFetchingUrl = ref(false)
  const inputMode = ref<'text' | 'url' | 'file'>('text')

  async function fetchUrl() {
    if (!url.value.trim()) return
    isFetchingUrl.value = true
    error.value = ''
    try {
      const res = await memberApi.fetchUrlContent(url.value.trim())
      // Append fetched URL content to existing text
      text.value = text.value.trim()
        ? text.value.trim() + '\n\n' + res.data.text
        : res.data.text
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? 'Failed to fetch URL.'
    } finally {
      isFetchingUrl.value = false
    }
  }

  async function run() {
    error.value = ''
    success.value = false

    // If URL is filled but not yet fetched, fetch it first
    if (url.value.trim() && !isFetchingUrl.value) {
      await fetchUrl()
      if (error.value) return
    }

    const hasFile = !!pendingFile.value
    const hasText = text.value.trim().length >= 10

    if (!hasFile && !hasText) {
      error.value = 'Please provide a description, URL, or file before running AI autofill.'
      return
    }

    isRunning.value = true
    try {
      let payload: FormData | { text: string }
      if (hasFile) {
        const fd = new FormData()
        fd.append('file', pendingFile.value!)
        if (hasText) fd.append('text', text.value.trim())
        payload = fd
        pendingFile.value = null
        uploadedFileName.value = ''
      } else {
        payload = { text: text.value.trim() }
      }

      const res = await memberApi.aiAutofill(payload)
      const data = unwrapData(res.data)

      // Apply identity — only fill fields that are currently empty
      const identityStore = useProgrammeIdentityStore()
      const id = data.identity ?? {}
      const d = identityStore.section1Data
      if (!d.name?.trim() && id.name) d.name = String(id.name)
      if (id.start_year) d.startYear = parseInt(id.start_year)
      if (id.end_year) d.endYear = parseInt(id.end_year)
      if (id.is_ongoing !== undefined) d.isOngoing = !!id.is_ongoing
      if (d.isOngoing) d.endYear = null
      if (d.fteStaff === null && id.fte_staff !== null && id.fte_staff !== undefined) d.fteStaff = id.fte_staff
      if (!d.budgetBand && id.budget_band && (BUDGET_BANDS as readonly string[]).includes(id.budget_band)) {
        d.budgetBand = id.budget_band
      }
      if (d.directBeneficiaries === null && id.direct_beneficiaries !== null && id.direct_beneficiaries !== undefined) d.directBeneficiaries = id.direct_beneficiaries
      if (d.indirectBeneficiaries === null && id.indirect_beneficiaries !== null && id.indirect_beneficiaries !== undefined) d.indirectBeneficiaries = id.indirect_beneficiaries

      // Apply activities
      const activitiesStore = useProgrammeActivitiesStore()
      const catsStore = useCategoriesStore()
      const codes: string[] = data.activities?.codes ?? []
      const suggestions = data.activities?.suggestions ?? {}
      codes.forEach(code => {
        if (!activitiesStore.selected.includes(code)) {
          activitiesStore.selected = [...activitiesStore.selected, code]
          activitiesStore.primary = [...activitiesStore.primary, code]
        }
        if (!activitiesStore.inclusions[code]) {
          activitiesStore.inclusions = { ...activitiesStore.inclusions, [code]: { hasInclusion: false, dimensions: [] } }
        }
        if (!activitiesStore.educationLevels[code]) {
          activitiesStore.educationLevels = { ...activitiesStore.educationLevels, [code]: [] }
        }
        const s = suggestions[code]
        if (s?.education_levels?.length) {
          activitiesStore.educationLevels = { ...activitiesStore.educationLevels, [code]: s.education_levels }
        }
        if (s?.inclusion) {
          activitiesStore.inclusions = { ...activitiesStore.inclusions, [code]: s.inclusion }
        }
      })
      if (codes.length) catsStore.openForCodes(codes)

      // Apply geography — only province level (district/commune require separate API calls)
      const geoStore = useProgrammeGeographyStore()
      const provinceIds: number[] = data.geography?.province_ids ?? []
      provinceIds.forEach(id => {
        if (!geoStore.provinceIds.includes(id)) {
          geoStore.provinceIds.push(id)
        }
      })

      // Apply agreements — merge with existing, avoid duplicates by institution_name
      const agreementsStore = useProgrammeAgreementsStore()
      const aiAgreements: any[] = data.agreements ?? []
      if (aiAgreements.length) {
        const existing = agreementsStore.agreements
        const existingNames = new Set(existing.map((a: any) => a.institution_name?.trim().toLowerCase()).filter(Boolean))
        const toAdd = aiAgreements
          .map((a: any) => ({
            counterpart_agency: a.counterpart_agency ?? '',
            nature: a.nature ?? '',
            status: a.status ?? '',
            institution_name: a.institution_name ?? '',
          }))
          .filter(a => !existingNames.has(a.institution_name.trim().toLowerCase()))
        if (toAdd.length) {
          agreementsStore.initFromPayload([...existing, ...toAdd])
        }
      }

      // Apply keywords
      const keywordsStore = useProgrammeKeywordsStore()
      const keywords: string[] = data.keywords ?? []
      if (keywords.length) {
        keywordsStore.initKeywords(keywords)
      }

      success.value = true
      setTimeout(() => { success.value = false }, 4000)
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? 'AI autofill failed. Please try again.'
    } finally {
      isRunning.value = false
    }
  }

  function reset() {
    text.value = ''
    url.value = ''
    pendingFile.value = null
    uploadedFileName.value = ''
    error.value = ''
    success.value = false
  }

  return {
    isRunning, error, success,
    text, url, pendingFile, uploadedFileName, isFetchingUrl, inputMode,
    fetchUrl, run, reset,
  }
})
