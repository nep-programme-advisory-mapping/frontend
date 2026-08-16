export interface Organisation {
  id: number
  name: string
  contact_name: string
  email: string
  member_since: number
  status: 'active' | 'inactive'
  last_inactive_at: string | null
  users_count: number
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface OrganisationForm {
  name: string
  contact_name: string
  email: string
  member_since: number
  logoFile?: File | null
}

export interface OrganisationListResponse {
  data: Organisation[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface OrganisationActionResponse {
  message: string
  organisation: Organisation
}

export interface CreateOrganisationPayload {
  name: string
  contact_name: string
  email: string
  member_since: number
}

export type UpdateOrganisationPayload = Partial<CreateOrganisationPayload>