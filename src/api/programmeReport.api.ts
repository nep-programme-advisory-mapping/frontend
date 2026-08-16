import api from '@/api/axios'

/**
 * Downloads the generated PDF report for a programme entry.
 * Role-restricted: Members can only download reports for their own assigned programs.
 */
export async function downloadProgrammeReportPdf(entryId: string | number, filename?: string) {
  const cleanId = String(entryId).replace('entry-', '')
  const response = await api.get(`/programme-entries/${cleanId}/pdf`, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename || `Programme_Report_${cleanId}.pdf`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Downloads consolidated PDF report for all programmes belonging to an organisation.
 */
export async function downloadOrganisationProgrammesPdf(organisationId: string | number, filename?: string) {
  const response = await api.get(`/organisations/${organisationId}/programme-entries/pdf`, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename || `Organisation_Programmes_${organisationId}.pdf`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
