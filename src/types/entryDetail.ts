export interface DetailActivity {
  code: string
  primary: boolean
  inclusion: { group: string; type: string } | null
  levels: number[]
  source: string | null
}

export interface DetailGovernmentAgreement {
  counterpart: string
  institution: string
  nature: string
  status: string
}

export interface EntryDetail {
  id: string
  name: string
  organisationId: number
  organisationName: string
  startYear: number | null
  endYear: number | null
  isOngoing: boolean
  staffFte: number | null
  budgetBand: string | null
  directBeneficiaries: number | null
  indirectBeneficiaries: number | null
  method: string
  verifiedDate: string
  isUnverified: boolean
  locations: { label: string; provinceName: string }[]
  activities: DetailActivity[]
  governmentAgreements: DetailGovernmentAgreement[]
  keywords: string[]
  otherCountries: string
  lastUpdated: string
  isDraft: boolean
}

export interface ActivityRow extends DetailActivity {
  item: { label: string } | null
}
