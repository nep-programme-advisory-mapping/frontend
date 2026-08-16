import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GovernmentAgreement } from '@/types/programme'

export const useProgrammeAgreementsStore = defineStore('programmeAgreements', () => {
  const agreements = ref<GovernmentAgreement[]>([])
  const showInlineErrors = ref(false)
  const section4Data = ref<GovernmentAgreement[]>([])

  const COUNTERPARTS = [
    { value: 'MoEYS national level', label: 'MoEYS — national level' },
    { value: 'Provincial Office of Education', label: 'Provincial Office of Education' },
    { value: 'District Office of Education', label: 'District Office of Education' },
    { value: 'Teacher Education Institution', label: 'Teacher Education Institution' },
    { value: 'specific school or cluster', label: 'Specific school or cluster of schools' },
    { value: 'other government ministry', label: 'Other government ministry or body' }
  ]

  const NATURES = [
    { value: 'MoU', label: 'MoU' },
    { value: 'Letter of Understanding', label: 'LoU' },
    { value: 'official approval letter', label: 'Approval letter' },
    { value: 'informal working arrangement', label: 'Informal' }
  ]

  const STATUSES = [
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'under renewal', label: 'Renewal' },
    { value: 'under negotiation', label: 'Negotiating' }
  ]

  function initFromPayload(val: GovernmentAgreement[] | undefined) {
    if (val) {
      agreements.value = JSON.parse(JSON.stringify(val))
    } else {
      agreements.value = []
    }
    section4Data.value = agreements.value
  }

  function addAgreement() {
    agreements.value.push({
      counterpart_agency: '',
      nature: '',
      status: '',
      institution_name: ''
    })
    section4Data.value = agreements.value
  }

  function removeAgreement(index: number) {
    agreements.value.splice(index, 1)
    section4Data.value = agreements.value
  }

  function validateSilent(): boolean {
    return agreements.value.every(a => {
      const firstThreeCompleted = !!(
        a.counterpart_agency.trim() !== '' &&
        a.nature.trim() !== '' &&
        a.status.trim() !== ''
      )
      const hasInstitution = a.institution_name.trim() !== ''

      // If the first three are completed, the last (institution details) is required.
      if (firstThreeCompleted) {
        return hasInstitution
      }

      // If they started filling the row, they must fill all fields.
      const isPartiallyFilled = !!(
        a.counterpart_agency.trim() !== '' ||
        a.nature.trim() !== '' ||
        a.status.trim() !== '' ||
        hasInstitution
      )
      if (isPartiallyFilled) {
        return false
      }

      // Completely empty row is valid
      return true
    })
  }

  function validate(): boolean {
    showInlineErrors.value = true
    return validateSilent()
  }

  function getData() {
    section4Data.value = [...agreements.value]
    return agreements.value
  }

  function reset() {
    agreements.value = []
    showInlineErrors.value = false
    section4Data.value = []
  }

  return {
    agreements,
    showInlineErrors,
    section4Data,
    COUNTERPARTS,
    NATURES,
    STATUSES,
    initFromPayload,
    addAgreement,
    removeAgreement,
    validateSilent,
    validate,
    getData,
    reset,
  }
})
