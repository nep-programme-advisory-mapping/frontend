export interface DashboardStats {
  total_organizations: number
  total_program_entries: number
  unverified_program_entries: number
  coordinator_advisory_notes: number | null
  total_advisory_notes: number
}

export interface CategoryCount {
  id: number
  code: string
  label: string
  programme_count: number
}

export interface ProvinceCount {
  id: number
  province_name: string
  programme_count: number
}

export type ActivityType = 'advisory_note' | 'programme_new' | 'programme_updated'

export interface RecentActivityItem {
  type: ActivityType
  id: number
  label: string
  programme?: string
  programme_entry_id?: number
  advisory_note_id?: number
  occurred_at: string
}
