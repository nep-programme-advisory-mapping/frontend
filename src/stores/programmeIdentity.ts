import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProgrammeIdentity } from '@/types/programme'

const YEAR_MIN = 1900
const YEAR_MAX = 2100

export const useProgrammeIdentityStore = defineStore('programmeIdentity', () => {
  const section1Data = ref<ProgrammeIdentity>({
    id: null,
    name: '',
    startYear: null,
    endYear: null,
    isOngoing: false,
    fteStaff: null,
    budgetBand: null,
    directBeneficiaries: null,
    indirectBeneficiaries: null,
    method: '',
    verifiedDate: '',
  })
  const section1Valid = ref(false)
  const clientErrors = ref<Record<string, string>>({})
  const touched = ref<Record<string, boolean>>({})

  // Computed min/disabled helpers
  const endYearMin = computed(() => {
    return section1Data.value.startYear !== null ? section1Data.value.startYear + 1 : YEAR_MIN
  })

  const isEndYearDisabled = computed(() => section1Data.value.isOngoing)

  const isSection1Complete = computed(() => {
    const d = section1Data.value
    return !!(
      d.name?.trim() &&
      d.startYear !== null && d.startYear >= YEAR_MIN && d.startYear <= YEAR_MAX &&
      (d.isOngoing || (d.endYear !== null && d.endYear >= YEAR_MIN && d.endYear <= YEAR_MAX && d.endYear > d.startYear)) &&
      d.fteStaff !== null && d.fteStaff >= 0 &&
      d.budgetBand &&
      d.directBeneficiaries !== null && d.directBeneficiaries >= 0 &&
      d.indirectBeneficiaries !== null && d.indirectBeneficiaries >= 0
    )
  })

  function initFromPayload(val: ProgrammeIdentity | undefined) {
    if (val) {
      section1Data.value = {
        id: val.id ?? null,
        name: val.name ?? '',
        startYear: val.startYear ?? null,
        endYear: val.endYear ?? null,
        isOngoing: val.isOngoing ?? false,
        fteStaff: val.fteStaff ?? null,
        budgetBand: val.budgetBand ?? null,
        directBeneficiaries: val.directBeneficiaries ?? null,
        indirectBeneficiaries: val.indirectBeneficiaries ?? null,
        method: val.method ?? '',
        verifiedDate: val.verifiedDate ?? '',
        isUnverified: val.isUnverified ?? false,
      }
    }
  }

  function touch(field: string) {
    touched.value[field] = true
  }

  function fieldToServerKey(field: string): string {
    const map: Record<string, string> = {
      name: 'programme_name',
      startYear: 'start_year',
      endYear: 'end_year',
      isOngoing: 'ongoing',
      fteStaff: 'fte_staff',
      budgetBand: 'budget_band_id',
      directBeneficiaries: 'direct_beneficiaries',
      indirectBeneficiaries: 'indirect_beneficiaries',
    }
    return map[field] || field
  }

  function fieldError(field: string, serverErrors?: Record<string, string[]>): string {
    const serverKey = fieldToServerKey(field)
    if (serverErrors?.[serverKey]?.length) {
      return serverErrors[serverKey][0] ?? ''
    }
    return touched.value[field] ? (clientErrors.value[field] ?? '') : ''
  }

  function inputClass(field: string, serverErrors?: Record<string, string[]>): string {
    const base = 'block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors sm:text-sm'
    const hasError = (touched.value[field] && clientErrors.value[field]) || serverErrors?.[fieldToServerKey(field)]?.length
    return hasError
      ? `${base} border-red-400 focus:ring-red-300 focus:border-red-400`
      : `${base} border-gray-300 focus:ring-teal-500 focus:border-teal-500`
  }

  function clampNonNegative(field: 'fteStaff' | 'directBeneficiaries' | 'indirectBeneficiaries') {
    const val = section1Data.value[field]
    if (val !== null && val < 0) {
      ;(section1Data.value as any)[field] = 0
    }
  }

  function validate(): boolean {
    touched.value = {
      name: true,
      startYear: true,
      endYear: true,
      fteStaff: true,
      budgetBand: true,
      directBeneficiaries: true,
      indirectBeneficiaries: true,
    }

    const e: Record<string, string> = {}
    const d = section1Data.value

    if (!d.name.trim()) {
      e.name = 'Programme name is required.'
    }

    if (d.startYear === null || d.startYear === undefined || (d.startYear as any) === '') {
      e.startYear = 'Start year is required.'
    } else if (d.startYear < YEAR_MIN || d.startYear > YEAR_MAX) {
      e.startYear = `Start year must be between ${YEAR_MIN} and ${YEAR_MAX}.`
    }

    if (!d.isOngoing) {
      if (d.endYear === null || d.endYear === undefined || (d.endYear as any) === '') {
        e.endYear = 'End year is required, or check "Ongoing".'
      } else if (d.endYear < YEAR_MIN || d.endYear > YEAR_MAX) {
        e.endYear = `End year must be between ${YEAR_MIN} and ${YEAR_MAX}.`
      } else if (d.startYear !== null && d.endYear <= d.startYear) {
        e.endYear = 'End year must be greater than start year.'
      }
    }

    if (d.fteStaff === null || d.fteStaff === undefined || (d.fteStaff as any) === '') {
      e.fteStaff = 'Number of staff is required.'
    } else if (d.fteStaff < 0) {
      e.fteStaff = 'Number of staff cannot be negative.'
    }

    if (!d.budgetBand) {
      e.budgetBand = 'Please select a budget band.'
    }

    if (d.directBeneficiaries === null || d.directBeneficiaries === undefined || (d.directBeneficiaries as any) === '') {
      e.directBeneficiaries = 'Direct beneficiaries count is required.'
    } else if (d.directBeneficiaries < 0) {
      e.directBeneficiaries = 'Direct beneficiaries cannot be negative.'
    }

    if (d.indirectBeneficiaries === null || d.indirectBeneficiaries === undefined || (d.indirectBeneficiaries as any) === '') {
      e.indirectBeneficiaries = 'Indirect beneficiaries count is required.'
    } else if (d.indirectBeneficiaries < 0) {
      e.indirectBeneficiaries = 'Indirect beneficiaries cannot be negative.'
    }

    clientErrors.value = e
    const isValid = Object.keys(e).length === 0
    section1Valid.value = isValid
    return isValid
  }

  function reset() {
    section1Data.value = {
      id: null,
      name: '',
      startYear: null,
      endYear: null,
      isOngoing: false,
      fteStaff: null,
      budgetBand: null,
      directBeneficiaries: null,
      indirectBeneficiaries: null,
      method: '',
      verifiedDate: '',
    }
    clientErrors.value = {}
    touched.value = {}
    section1Valid.value = false
  }

  return {
    section1Data,
    section1Valid,
    clientErrors,
    touched,
    endYearMin,
    isEndYearDisabled,
    isSection1Complete,
    initFromPayload,
    touch,
    fieldError,
    inputClass,
    clampNonNegative,
    validate,
    reset,
  }
})
