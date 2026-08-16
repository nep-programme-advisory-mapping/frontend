import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, watch } from 'vue'
import router from '@/router'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import { BUDGET_BANDS } from '@/constants/programme'
import { useCategoriesStore } from './categories'
import { useAuthStore } from './auth'
import { useProgrammeIdentityStore } from './programmeIdentity'
import { useProgrammeActivitiesStore } from './programmeActivities'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useProgrammeAgreementsStore } from './programmeAgreements'
import { useProgrammeKeywordsStore } from './programmeKeywords'
import { useProgrammeSaveStore, ensureTaxonomyMaps, dbIdToCodeMap, taxonomyMap } from './programmeSave'

export const useProgrammeFormStore = defineStore('programmeForm', () => {
  const toast = useToast()

  // --- Sub Stores ---
  const identityStore = useProgrammeIdentityStore()
  const activitiesStore = useProgrammeActivitiesStore()
  const geographyStore = useProgrammeGeographyStore()
  const agreementsStore = useProgrammeAgreementsStore()
  const keywordsStore = useProgrammeKeywordsStore()
  const saveStore = useProgrammeSaveStore()

  const { section1Data, section1Valid } = storeToRefs(identityStore)
  const { section2Data } = storeToRefs(activitiesStore)
  const { section3Data } = storeToRefs(geographyStore)
  const { section4Data } = storeToRefs(agreementsStore)
  const { keywordsData, keywordsError } = storeToRefs(keywordsStore)
  const { isSaving, saveStatus, errors, submissionResult } = storeToRefs(saveStore)

  // --- Step state ---
  const currentStep = ref(1)
  const isInitializing = ref(false)
  const _cachedOrgId = ref<string | null>(null)
  let _initPromise: Promise<void> | null = null
  let _initId: string | null = null

  const steps = [
    { number: 1, title: 'Programme identity', subtitle: 'Name, dates, scale', shortTitle: 'Programme' },
    { number: 2, title: 'Activities', subtitle: 'Taxonomy B1–B9', shortTitle: 'Activities' },
    { number: 3, title: 'Geographic coverage', subtitle: 'Provinces & districts', shortTitle: 'Geographic' },
    { number: 4, title: 'Government agreements', subtitle: 'Counterparts & status', shortTitle: 'Agreements' },
    { number: 5, title: 'Keywords', subtitle: 'Up to 5 tags', shortTitle: 'Keywords' },
  ]

  // --- Form refs ---
  const identityFormRef = ref<any>(null)
  const activitiesFormRef = ref<any>(null)
  const geographicFormRef = ref<any>(null)
  const agreementsFormRef = ref<any>(null)

  // --- Computed ---
  const completedSteps = computed(() => {
    const completed = new Set<number>()
    if (identityStore.isSection1Complete) completed.add(1)
    if ((section2Data.value?.selected || []).length > 0 || activitiesStore.selected?.length > 0) completed.add(2)
    if ((section3Data.value?.provinceIds || []).length > 0 || !!section3Data.value?.otherCountries) completed.add(3)
    if ((section4Data.value || []).length > 0) completed.add(4)
    if (keywordsData.value.length > 0) completed.add(5)
    return completed
  })

  const pageTitle = computed(() => section1Data.value?.name?.trim() || 'New programme entry')
  const progressPercent = computed(() => (currentStep.value / 5) * 100)
  const saveLabel = computed(() => {
    if (isSaving.value) return 'Saving…'
    if (saveStatus.value === 'saved') return 'Saved'
    return 'Not yet saved'
  })
  const currentStepTitle = computed(() => steps[currentStep.value - 1]?.title || '')
  const stepperProgressPercent = computed(() => ((currentStep.value - 1) / (steps.length - 1)) * 100)
  const stepWidthPercent = computed(() => 100 / steps.length)
  const isFinalStep = computed(() => currentStep.value === 5)

  const isSection2Complete = computed(() =>
    (section2Data.value?.selected || []).length > 0 || activitiesStore.selected?.length > 0
  )
  const isSection3Complete = computed(() =>
    (section3Data.value?.provinceIds || []).length > 0 || !!section3Data.value?.otherCountries
  )
  const hasCompletedAllRequired = computed(() =>
    !!identityStore.isSection1Complete && isSection2Complete.value && isSection3Complete.value && keywordsData.value.length > 0
  )

  const continueButtonText = computed(() => {
    const isStaff = ['nep_admin', 'nep_coordinator'].includes((useAuthStore() as any).userRole || '')
    if (currentStep.value === 1) return 'Continue: Activities'
    if (currentStep.value === 2) return 'Continue: Geographic coverage'
    if (currentStep.value === 3) return 'Continue: Government agreements'
    if (currentStep.value === 4) return 'Continue: Keywords'
    if (isStaff) return 'Save draft for organisation'
    return hasCompletedAllRequired.value ? 'Finish & save' : 'Save draft & exit'
  })

  const section1Progress = computed(() => {
    const d = section1Data.value
    return [!!d.name, !!d.startYear, d.isOngoing || !!d.endYear, !!d.fteStaff, !!d.budgetBand,
      !!d.directBeneficiaries, !!d.indirectBeneficiaries, !!d.method, !!d.verifiedDate]
      .filter(Boolean).length
  })

  const currentSectionProgress = computed(() => {
    if (currentStep.value === 1) return { current: section1Progress.value, total: 9 }
    if (currentStep.value === 5) return { current: keywordsData.value.length, total: 5 }
    return { current: 0, total: 0 }
  })

  const nextStepLabel = computed(() => {
    const next = steps[currentStep.value]
    return next ? `Continue: ${next.title.replace(/^\d+ · /, '')} →` : 'Finish →'
  })

  const backStepLabel = computed(() => {
    const prev = steps[currentStep.value - 2]
    return prev ? `← Back: ${prev.title.replace(/^\d+ · /, '')}` : ''
  })

  // --- Org ID ---
  function getCreateOrgId(): string | null {
    const fromUrl = router.currentRoute.value.query.org_id
    if (fromUrl) _cachedOrgId.value = String(fromUrl)
    return _cachedOrgId.value
  }

  // --- Reset ---
  function resetAll() {
    identityStore.reset()
    activitiesStore.reset()
    geographyStore.reset()
    agreementsStore.reset()
    keywordsStore.reset()
    currentStep.value = 1
    _cachedOrgId.value = null
    saveStore.clearSubmissionResult()
    saveStore.isSaving = false
    stopAutosaveWatch()
  }

  // --- Init ---
  async function initializeForm(entryId: string | null) {
    if (_initPromise && _initId === entryId) return _initPromise

    _initId = entryId
    const orgIdFromUrl = router.currentRoute.value.query.org_id

    _initPromise = (async () => {
      isInitializing.value = true
      resetAll()
      if (orgIdFromUrl) _cachedOrgId.value = String(orgIdFromUrl)

      try {
        const catsStore = useCategoriesStore()
        await catsStore.loadCategories()

        const [entryResult, geoResult, agreementsResult] = await Promise.all([
          entryId ? memberApi.getProgrammeEntry(entryId) : Promise.resolve(null),
          entryId ? memberApi.getGeography(entryId) : Promise.resolve(null),
          entryId ? memberApi.getGovernmentAgreements(entryId) : Promise.resolve(null),
        ])

        catsStore.categories.forEach((cat: any) => {
          cat.subcategories?.forEach((sub: any) => {
            sub.items?.forEach((item: any) => {
              dbIdToCodeMap.value[item.id] = item.code
              taxonomyMap.value[item.code] = item.id
            })
          })
        })

        if (entryId && entryResult) {
          const entry = entryResult.data.data || entryResult.data
          _loadEntryIntoStores(entry, geoResult, agreementsResult)
          saveStore.saveStatus = 'saved'
        }
      } catch (err: any) {
        if (entryId) toast.error('Failed to load the programme entry data.')
      }

      if (!entryId) _restoreSessionDraft()
    })()

    try {
      await _initPromise
    } finally {
      isInitializing.value = false
      if (_initId === entryId) _initPromise = null
      // Start watching for changes only after the initial load has settled,
      // so loading an existing draft doesn't itself count as a dirty edit.
      startAutosaveWatch()
    }
  }

  function _loadEntryIntoStores(entry: any, geoResult: any, agreementsResult: any) {
    section1Data.value = {
      id: entry.id,
      name: entry.programme_name || '',
      startYear: entry.start_year || null,
      endYear: entry.end_year || null,
      isOngoing: !!entry.ongoing,
      fteStaff: entry.fte_staff ? parseFloat(entry.fte_staff) : null,
      budgetBand: (entry.budget_band_id ? BUDGET_BANDS[entry.budget_band_id - 1] : null) || null,
      directBeneficiaries: entry.direct_beneficiaries || null,
      indirectBeneficiaries: entry.indirect_beneficiaries || null,
      method: entry.method || '',
      verifiedDate: entry.verified_date || '',
      isUnverified: !!entry.is_unverified,
    }

    const getCode = (a: any): string => {
      if (!a) return ''
      if (a.code) return a.code
      if (a.activity_item?.code) return a.activity_item.code
      if (a.activityItem?.code) return a.activityItem.code
      const itemId = a.activity_item_id ?? a.activityItemId
      if (itemId != null) {
        return dbIdToCodeMap.value[itemId] || dbIdToCodeMap.value[Number(itemId)] || ''
      }
      return ''
    }

    const selectedCodes = Array.from(new Set((entry.activities?.map(getCode).filter(Boolean) || []) as string[]))
    const primaryCodes = Array.from(new Set(
      (entry.activities?.filter((a: any) => a.is_primary || a.primary).map(getCode).filter(Boolean) || []) as string[]
    ))
    const inclusionsMap: Record<string, any> = {}
    const educationLevelsMap: Record<string, number[]> = {}
    const otherTextMap: Record<string, string> = {}
    entry.activities?.forEach((a: any) => {
      const code = getCode(a)
      if (!code) return
      inclusionsMap[code] = {
        hasInclusion: !!a.inclusion_group,
        dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : [],
      }
      educationLevelsMap[code] = Array.from(new Set(
        (a.activity_levels?.map((l: any) => Number(l.education_level_id)) || []).filter((n: number) => !isNaN(n) && n > 0)
      ))
      if (a.other_text || a.otherText) {
        otherTextMap[code] = a.other_text || a.otherText
      }
    })
    const s2 = { selected: selectedCodes, primary: primaryCodes, aiText: '', inclusions: inclusionsMap, educationLevels: educationLevelsMap, otherText: otherTextMap }
    section2Data.value = s2
    activitiesStore.initFromPayload(s2)

    const locationData = geoResult?.data?.data || (Array.isArray(geoResult?.data) ? geoResult.data : null) || entry.locations || []
    const provinceIds: number[] = []
    const districts: Record<number, number[]> = {}
    const communes: Record<number, number[]> = {}
    const villages: Record<number, number[]> = {}
    const otherCountries: string[] = []
    locationData.forEach((loc: any) => {
      if (loc.country) {
        otherCountries.push(loc.country)
      } else if (loc.province_id) {
        if (!provinceIds.includes(loc.province_id)) provinceIds.push(loc.province_id)
        if (loc.district_id) districts[loc.province_id] = [...(districts[loc.province_id] || []).filter((id: number) => id !== loc.district_id), loc.district_id]
        if (loc.commune_id) communes[loc.district_id] = [...(communes[loc.district_id] || []).filter((id: number) => id !== loc.commune_id), loc.commune_id]
        if (loc.village_id) villages[loc.commune_id] = [...(villages[loc.commune_id] || []).filter((id: number) => id !== loc.village_id), loc.village_id]
      }
    })
    geographyStore.initFromPayload({ provinceIds, districts, communes, villages, otherCountries: otherCountries.join(', ') })

    const rawAgreements = agreementsResult?.data?.data || (Array.isArray(agreementsResult?.data) ? agreementsResult.data : null) || entry.government_agreements || []
    section4Data.value = rawAgreements
    agreementsStore.initFromPayload(rawAgreements)

    if (entry.keywords?.length) {
      keywordsStore.initKeywords(entry.keywords.map((k: any) => k.keyword).filter(Boolean))
    }
  }

  function _restoreSessionDraft() {
    const savedDraft = sessionStorage.getItem('new_programme_entry_draft')
    if (!savedDraft) return
    try {
      const draft = JSON.parse(savedDraft)
      currentStep.value = draft.currentStep || 1
      section1Data.value = draft.section1Data
      section2Data.value = draft.section2Data
      activitiesStore.initFromPayload(draft.section2Data)
      geographyStore.initFromPayload(draft.section3Data || { provinceIds: [], districts: {}, communes: {}, villages: {}, otherCountries: '' })
      section4Data.value = draft.section4Data || []
      keywordsStore.initKeywords(draft.keywordsData || [])
      toast.success('Resumed from saved draft.')
    } catch {
      // malformed draft — ignore
    }
  }

  // --- Sync form component refs into stores ---
  function syncRefsToStore() {
    if (activitiesFormRef.value) {
      section2Data.value = activitiesFormRef.value.getData()
    } else if (activitiesStore.selected?.length > 0) {
      section2Data.value = activitiesStore.getData()
    }
    if (agreementsFormRef.value) {
      section4Data.value = agreementsFormRef.value.getData()
    } else if (agreementsStore.section4Data?.length > 0) {
      section4Data.value = agreementsStore.getData()
    }
  }

  // --- Validation ---
  function validateCurrentStep(): boolean {
    if (currentStep.value === 1) return identityFormRef.value?.validate?.() ?? true
    if (currentStep.value === 2) return activitiesFormRef.value?.validate?.() ?? true
    if (currentStep.value === 4) return agreementsFormRef.value?.validate?.() ?? true
    return true
  }

  // --- Navigation ---
  function goBack() {
    syncRefsToStore()
    if (currentStep.value > 1) currentStep.value--
  }

  function goToStep(stepNumber: number) {
    if (stepNumber > 1) {
      const valid = identityFormRef.value ? identityFormRef.value.validate() : identityStore.validate()
      if (!valid) { currentStep.value = 1; return false }
    }
    if (stepNumber === 5 && currentStep.value === 4) {
      const valid = agreementsFormRef.value ? agreementsFormRef.value.validate() : agreementsStore.validate()
      if (!valid) return false
    }
    syncRefsToStore()
    currentStep.value = stepNumber
    return true
  }

  async function advanceStep() {
    if (!validateCurrentStep()) return
    syncRefsToStore()
    sessionStorage.setItem('new_programme_entry_draft', JSON.stringify({
      currentStep: currentStep.value + 1,
      section1Data: section1Data.value,
      section2Data: section2Data.value,
      section3Data: section3Data.value,
      section4Data: section4Data.value,
      keywordsData: keywordsData.value,
    }))
    if (currentStep.value < 5) currentStep.value++
  }

  // --- Save ---
  async function saveEntry(exitAfterSave: boolean, isSubmit = false, loadingAlreadySet = false, silent = false): Promise<boolean> {
    return saveStore.saveEntry(exitAfterSave, isSubmit, loadingAlreadySet, getCreateOrgId(), silent)
  }

  async function saveAndExit(isSubmit = false, loadingAlreadySet = false): Promise<boolean> {
    syncRefsToStore()
    const isStaff = ['nep_admin', 'nep_coordinator'].includes((useAuthStore() as any).userRole || '')

    if (isSubmit && !isStaff) {
      const missing = [1, 2, 3, 5].filter(s => !completedSteps.value.has(s))
      if (missing.length > 0) {
        toast.error("Please complete steps 1, 2, 3, and 5 to submit. If you're not ready, you can save your draft and exit by clicking 'Save & exit' in the top right corner.")
        return false
      }
      if (keywordsError.value) {
        toast.error('Please remove duplicate keywords before saving.')
        return false
      }
    } else {
      if (!section1Data.value.name?.trim() || !section1Data.value.startYear) {
        toast.error('Please complete Step 1 (Programme name and Start year) before saving.')
        return false
      }
    }
    return saveEntry(true, isSubmit, loadingAlreadySet)
  }

  async function continueToNext() {
    if (isFinalStep.value) {
      await saveAndExit(hasCompletedAllRequired.value)
    } else {
      await advanceStep()
    }
  }

  function saveDraftAndExit() {
    sessionStorage.setItem('new_programme_entry_draft', JSON.stringify({
      currentStep: currentStep.value,
      section1Data: section1Data.value,
      section2Data: section2Data.value,
      section3Data: section3Data.value,
      section4Data: section4Data.value,
    }))
    toast.success('Progress saved to session.')
    router.push('/dashboard')
  }

  // --- Auto-save ---
  // Available to every role that reaches this wizard (member_org filling in
  // their own entry, nep_coordinator/nep_admin filling one in for an org).
  // Debounces ~4s after the last edit, plus a 45s fallback in case a burst
  // of edits keeps pushing the debounce back. Reuses the same saveEntry()
  // path as the manual "Save & exit" button, just silent=true.
  const AUTOSAVE_PREF_KEY = 'programme_autosave_enabled'
  const AUTOSAVE_DEBOUNCE_MS = 4000
  const AUTOSAVE_INTERVAL_MS = 45000

  function loadAutosavePref(): boolean {
    const stored = localStorage.getItem(AUTOSAVE_PREF_KEY)
    return stored === null ? true : stored === 'true' // on by default
  }

  const autosaveEnabled = ref<boolean>(loadAutosavePref())
  const autosaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

  let autosaveDebounceTimer: ReturnType<typeof setTimeout> | null = null
  let autosaveIntervalTimer: ReturnType<typeof setInterval> | null = null
  let autosaveDirty = false
  let stopAutosaveDeepWatch: (() => void) | null = null

  // Same minimum-required-fields gate as the non-submit "Save & exit" path,
  // so autosave doesn't hammer the backend with 422s on an empty form.
  const canAutosave = computed(() =>
    !!section1Data.value.name?.trim() && !!section1Data.value.startYear
  )

  watch(autosaveEnabled, (enabled) => {
    localStorage.setItem(AUTOSAVE_PREF_KEY, String(enabled))
    if (enabled) armAutosaveInterval()
    else disarmAutosaveTimers()
  })

  function markAutosaveDirty() {
    autosaveDirty = true
    if (!autosaveEnabled.value) return
    if (autosaveDebounceTimer) clearTimeout(autosaveDebounceTimer)
    autosaveDebounceTimer = setTimeout(runAutosave, AUTOSAVE_DEBOUNCE_MS)
  }

  async function runAutosave() {
    if (!autosaveEnabled.value || !autosaveDirty) return
    if (isInitializing.value || isSaving.value) return
    if (!canAutosave.value) return
    syncRefsToStore()
    autosaveStatus.value = 'saving'
    const ok = await saveEntry(false, false, false, true)
    autosaveDirty = !ok
    autosaveStatus.value = ok ? 'saved' : 'error'
  }

  function armAutosaveInterval() {
    if (autosaveIntervalTimer) return
    autosaveIntervalTimer = setInterval(() => { if (autosaveDirty) runAutosave() }, AUTOSAVE_INTERVAL_MS)
  }

  function disarmAutosaveTimers() {
    if (autosaveDebounceTimer) { clearTimeout(autosaveDebounceTimer); autosaveDebounceTimer = null }
    if (autosaveIntervalTimer) { clearInterval(autosaveIntervalTimer); autosaveIntervalTimer = null }
  }

  function startAutosaveWatch() {
    stopAutosaveWatch()
    stopAutosaveDeepWatch = watch(
      [section1Data, section2Data, section3Data, section4Data, keywordsData],
      () => { if (!isInitializing.value) markAutosaveDirty() },
      { deep: true },
    )
    if (autosaveEnabled.value) armAutosaveInterval()
  }

  function stopAutosaveWatch() {
    stopAutosaveDeepWatch?.()
    stopAutosaveDeepWatch = null
    disarmAutosaveTimers()
    autosaveDirty = false
    autosaveStatus.value = 'idle'
  }

  return {
    // state (proxied from sub-stores)
    section1Data, section2Data, section3Data, section4Data,
    keywordsData, keywordsError, section1Valid,
    // save store state
    isSaving, saveStatus, errors, submissionResult,
    // step state
    currentStep, isInitializing,
    // taxonomy maps (for components that need them)
    dbIdToCodeMap, taxonomyMap,
    // form refs
    steps, identityFormRef, activitiesFormRef, geographicFormRef, agreementsFormRef,
    // computed
    pageTitle, progressPercent, saveLabel, currentStepTitle,
    stepperProgressPercent, stepWidthPercent, isFinalStep,
    nextStepLabel, backStepLabel, continueButtonText,
    currentSectionProgress, hasCompletedAllRequired, completedSteps,
    // auto-save
    autosaveEnabled, autosaveStatus, stopAutosaveWatch,
    // actions
    initializeForm, resetAll,
    saveEntry, saveAndExit, saveDraftAndExit,
    goBack, goToStep, advanceStep, continueToNext,
    clearError: saveStore.clearError,
    clearSubmissionResult: saveStore.clearSubmissionResult,
    onSaveRouteUpdate: saveStore.onSaveRouteUpdate,
  }
})
