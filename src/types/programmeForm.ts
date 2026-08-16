import type { ProgrammeIdentity } from './programmeIdentity'
import type { ProgrammeActivitiesData } from './programmeActivities'
import type { ProgrammeGeographicData } from './programmeGeographic'
import type { GovernmentAgreement } from './programmeAgreements'

export interface ProgrammeFormDraft {
  currentStep: number
  section1Data: ProgrammeIdentity
  section2Data: ProgrammeActivitiesData | null
  section3Data: ProgrammeGeographicData
  section4Data: GovernmentAgreement[]
}
