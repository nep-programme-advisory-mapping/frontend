import api from './axios'
import type { PolicyDocument, PolicyDocumentPayload } from '@/types/policy'

/** Build a FormData object from a payload, including an optional File. */
function buildFormData(payload: Omit<PolicyDocumentPayload, 'file'>, file?: File | null): FormData {
  const fd = new FormData()
  fd.append('title', payload.title)
  fd.append('authority', payload.authority)
  fd.append('version', payload.version)
  fd.append('date', payload.date)
  if (payload.status) fd.append('status', payload.status)
  if (file) fd.append('file', file)
  return fd
}

export const policyApi = {
  /**
   * Fetch all policy documents from backend.
   */
  getPolicies() {
    return api.get<{ data: PolicyDocument[] } | PolicyDocument[]>('/policy-documents')
  },

  /**
   * Create a new policy document (with optional file upload).
   */
  createPolicy(payload: PolicyDocumentPayload) {
    const fd = buildFormData(payload, payload.file)
    return api.post<{ message: string; data: PolicyDocument }>('/policy-documents', fd)
  },

  /**
   * Update a policy document (with optional file upload).
   * Uses POST with _method=PATCH so multipart/form-data works with Laravel.
   */
  updatePolicy(id: number, payload: Partial<PolicyDocumentPayload>) {
    const fd = buildFormData(
      { title: payload.title ?? '', authority: payload.authority ?? '', version: payload.version ?? '', date: payload.date ?? '', status: payload.status },
      payload.file
    )
    fd.append('_method', 'PATCH')
    return api.post<{ message: string; data: PolicyDocument }>(`/policy-documents/${id}`, fd)
  },

  /**
   * Delete a policy document.
   */
  deletePolicy(id: number) {
    return api.delete<{ message: string }>(`/policy-documents/${id}`)
  },

  /**
   * Fetch a policy document's file as a blob.
   */
  fetchFile(id: number) {
    return api.get<Blob>(`/policy-documents/${id}/file`, { responseType: 'blob' })
  },

  /**
   * Download a policy document's file.
   */
  async downloadFile(id: number, filename: string) {
    const response = await api.get<Blob>(`/policy-documents/${id}/file`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
