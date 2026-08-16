import api from './axios'
import type { MapFilters } from '@/types/map'

/**
 * Fetches all programme entries for the map view.
 *
 * @returns Axios response whose `data.data` contains the entry list.
 */
export async function getMapEntries() {
  return api.get('/map/entries', { params: { format: 'flat', per_page: 1000 } })
}

/**
 * Triggers a CSV download of map entries matching the given filters.
 *
 * @param filters - API filter parameters to pass as query string.
 * @returns A promise that resolves when the download has been initiated.
 */
export async function exportMapEntriesCsv(filters: MapFilters) {
  const response = await api.get('/map/entries/export', {
    params: filters,
    responseType: 'blob',
  })

  downloadFile(
    response.data,
    'programme-entries.csv',
    'text/csv;charset=utf-8'
  )
}

/**
 * Triggers a PDF download of a map entries report matching the given filters.
 *
 * @param filters - API filter parameters to pass as query string.
 * @returns A promise that resolves when the download has been initiated.
 */
export async function exportMapEntriesPdf(filters: MapFilters) {
  const response = await api.get('/map/entries/export/pdf', {
    params: filters,
    responseType: 'blob',
  })

  downloadFile(
    response.data,
    'programme-entries-report.pdf',
    'application/pdf'
  )
}

/**
 * Creates a Blob from the response data, generates an object URL, and
 * programmatically clicks a hidden anchor element to trigger the browser
 * download dialog.
 *
 * @param data - Raw blob data from the API response.
 * @param filename - Desired filename for the downloaded file.
 * @param type - MIME type of the file (e.g. "text/csv").
 */
function downloadFile(
  data: BlobPart,
  filename: string,
  type: string
) {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}
