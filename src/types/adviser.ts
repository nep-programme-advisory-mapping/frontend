import type { User } from './user'
import type { AdvisoryNoteStatusValue } from '@/constants/advisoryStatus'

export type AnalysisScope = 'full map' | 'geographic subset' | 'thematic subset'
export type SubmissionStatus = AdvisoryNoteStatusValue

export interface SubmissionProgrammeEntry {
    id: number
    programme_name?: string
    is_submitted?: number | boolean
    activities?: { activity_item_id: number; activityItem?: { id: number; subcategory?: { id: number; category_id: number } } }[]
    locations?: { province_id: number | null; district_id: number | null; commune_id: number | null }[]
}

export interface Submission {
    id: number
    programme_entry_id?: number | null
    programme_entry?: SubmissionProgrammeEntry | null
    coordinator_id: number | null
    coordinator?: { id: number; name: string } | null
    assign_to_staff_user_id?: number | null
    staff_user?: { id: number; name: string; email?: string; role?: string } | null
    submitting_party: string
    document_name: string
    analysis_scope: string
    analysis_scope_detail: string | null
    status: SubmissionStatus
    section_profile: string | null
    section_gaps: string | null
    section_coordinators_notes: string | null
    final_note_file: string | null
    final_note_file_url: string | null
    submitted_at: string
    delivered_at: string | null
    created_at: string
    updated_at: string
    recommendations?: AdvisoryRecommendation[]
}

export interface AdvisoryRecommendation {
    id: number
    advisory_note_id: number
    programme_entry_id: number | null
    organisation_name: string | null
    programme_name: string | null
    type: string
    relational: string | null
    rationale: string | null
}

export interface PaginationLink {
    url: string | null
    label: string
    page: number | null
    active: boolean
}

export interface SubmissionCreateResponse {
    message: string
    data: Submission
}

export interface SubmissionListParams {
    analysis_scope?: string
    status?: string
    per_page?: number
    page?: number
}

export interface SubmissionPayload {
    submitting_party: string
    document_name: string
    analysis_scope: string
    analysis_scope_detail?: string | null
    coordinator_id?: number | null
    programme_entry_id?: number | null
}

export interface CoordinatorListResponse {
    data: User[]
}

export interface PaginatedSubmissions {
    current_page: number
    data: Submission[]
    first_page_url: string
    from: number | null
    last_page: number
    last_page_url: string
    links: PaginationLink[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number | null
    total: number
}
