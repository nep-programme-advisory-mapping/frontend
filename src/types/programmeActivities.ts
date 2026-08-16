import type { ActivityInclusion } from './taxonomy'

export interface ProgrammeActivitiesData {
  selected: string[]
  primary: string[]
  aiText: string
  inclusions: Record<string, ActivityInclusion>
  educationLevels: Record<string, number[]>
}
