export interface PolicyDocument {
  id: number
  title: string
  authority: string
  version: string
  date: string
  status: 'active' | 'superseded' | 'inactive'
  file_url?: string | null
  file_name?: string | null
  mime_type?: string | null
  file_size?: number | null
  has_file?: boolean
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface PolicyDocumentPayload {
  title: string
  authority: string
  version: string
  date: string
  status?: 'active' | 'superseded' | 'inactive'
  file?: File | null
}

export interface PolicyFormPayload {
  title: string
  authority: string
  version: string
  date: string
  status: 'active' | 'superseded' | 'inactive'
  file?: File | null
}
