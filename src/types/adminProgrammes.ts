export interface EntryRow {
  id: number
  programme_name: string
  is_submitted: boolean
  is_unverified: boolean
  start_year: number | null
  end_year: number | null
  organisation: { name: string } | null
  primaryActivities?: string[]
  relativeUpdated: string
}
