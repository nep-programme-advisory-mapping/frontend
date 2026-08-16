import { ref } from 'vue'
import { policyApi } from '@/api/policy.api'

export function usePolicyDocumentLoader() {
  const fileObjectUrl = ref<string | null>(null)
  const fileLoading = ref(false)
  const fileError = ref(false)
  const fileErrorMsg = ref('')
  const docxHtml = ref<string | null>(null)
  const docxError = ref(false)
  const docxLoading = ref(false)
  const docxErrorMsg = ref('')

  async function loadFile(id: number) {
    fileLoading.value = true
    fileError.value = false
    fileErrorMsg.value = ''
    fileObjectUrl.value = null
    docxHtml.value = null
    docxError.value = false
    docxErrorMsg.value = ''

    try {
      const response = await policyApi.fetchFile(id)
      const blob = new Blob([response.data], {
        type: (response.headers['content-type'] as string) || 'application/octet-stream',
      })
      fileObjectUrl.value = URL.createObjectURL(blob)
      return blob
    } catch (error: any) {
      fileError.value = true
      fileErrorMsg.value = error?.response?.data?.message || error?.message || 'Failed to load document'
      return null
    } finally {
      fileLoading.value = false
    }
  }

  async function loadDocx(blob: Blob) {
    docxLoading.value = true
    try {
      const mammoth = await import('mammoth')
      const arrayBuffer = await blob.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      docxHtml.value = result.value || '<p style="color:#6b7280">Document is empty.</p>'
    } catch (e: any) {
      const msg = e?.message ?? String(e)
      console.error('[PolicyDocumentPreview] Failed to render DOCX:', msg)
      docxErrorMsg.value = msg
      docxError.value = true
    } finally {
      docxLoading.value = false
    }
  }

  function cleanup() {
    if (fileObjectUrl.value) {
      URL.revokeObjectURL(fileObjectUrl.value)
      fileObjectUrl.value = null
    }
    docxHtml.value = null
    docxError.value = false
    fileError.value = false
  }

  async function downloadDocument(id: number, filename: string) {
    try {
      await policyApi.downloadFile(id, filename)
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  return {
    fileObjectUrl,
    fileLoading,
    fileError,
    fileErrorMsg,
    docxHtml,
    docxError,
    docxLoading,
    docxErrorMsg,
    loadFile,
    loadDocx,
    cleanup,
    downloadDocument,
  }
}
