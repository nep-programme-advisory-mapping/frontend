import type { BudgetBand } from '@/constants/programme'

export interface Activity {
  code: string
  primary: boolean
}

export interface ProgrammeIdentity {
  id?: number | null
  name: string
  startYear: number | null
  endYear: number | null
  isOngoing: boolean
  fteStaff: number | null
  budgetBand: BudgetBand | null
  directBeneficiaries: number | null
  indirectBeneficiaries: number | null
  method: string
  verifiedDate: string
  isUnverified?: boolean
  activities?: Activity[]
  provinces?: string[]
  lastUpdated?: string
  isDraft?: boolean
}
