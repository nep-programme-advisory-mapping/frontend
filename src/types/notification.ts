export interface AppNotification {
  id: string
  type: 'programme_sent' | 'adviser_submission_assigned' | 'advice_delivered' | string
  title: string
  message: string
  programme_entry_id: number | null
  advisory_note_id: number | null
  read_at: string | null
  created_at: string
}

// Shape broadcast by the backend on .programme.draft.created
export interface ProgrammeDraftCreatedPayload {
  notification_id: string
  programme_entry_id: number
  programme_name: string
  message: string
}
