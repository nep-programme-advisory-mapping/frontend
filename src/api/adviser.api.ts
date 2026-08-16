import api from './axios'
import type { SubmissionListParams, SubmissionPayload, Submission, SubmissionCreateResponse, CoordinatorListResponse, PaginatedSubmissions } from '@/types/adviser'

const programmeEntryNotePromises = new Map<number, Promise<any>>()

export const adviserApi = {
    /**
     * Fetch a paginated list of submissions.
     */
    list(params: SubmissionListParams = {}) {
        return api.get<PaginatedSubmissions>('/adviser/submissions', { params })
    },

    /**
     * Fetch all active coordinators for the assignment dropdown.
     */
    listCoordinators() {
        return api.get<CoordinatorListResponse>('/adviser/coordinators')
    },

    /**
     * Fetch a single submission by ID.
     */
    getById(id: number) {
        return api.get<{ data: Submission } | Submission>(`/adviser/submissions/${id}`)
    },

    /**
     * Submit a new document for analysis.
     */
    submit(payload: SubmissionPayload, file?: File) {
        if (file) {
            const form = new FormData()
            Object.entries(payload).forEach(([k, v]) => {
                if (v !== null && v !== undefined) form.append(k, String(v))
            })
            form.append('document', file)
            return api.post<SubmissionCreateResponse>('/adviser/submissions', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            })
        }
        return api.post<SubmissionCreateResponse>('/adviser/submissions', payload)
    },

    /**
     * Save advisory note sections A, B, C, D.
     */
    _updateSectionsPromises: new Map<number, Promise<any>>(),
    updateSections(id: number, payload: {
        section_profile?: string
        section_gaps?: string
        section_coordinators_notes?: string
        recommendations?: { organisation_name: string | null; programme_name?: string | null; type: string; relational: string | null; rationale?: string | null; programme_entry_id: number | null }[]
    }) {
        if (this._updateSectionsPromises.has(id)) return this._updateSectionsPromises.get(id)!
        const p = api.patch<{ data: Submission }>(`/adviser/submissions/${id}`, payload)
            .finally(() => this._updateSectionsPromises.delete(id))
        this._updateSectionsPromises.set(id, p)
        return p
    },

    /**
     * Mark a submission's status as advice_delivered.
     */
    _deliverPromises: new Map<number, Promise<any>>(),
    markDelivered(id: number) {
        if (this._deliverPromises.has(id)) return this._deliverPromises.get(id)!
        const p = api.patch<{ data: Submission }>(`/adviser/submissions/${id}/deliver`)
            .finally(() => this._deliverPromises.delete(id))
        this._deliverPromises.set(id, p)
        return p
    },

    /**
     * Update the coordinator assigned to a submission.
     */
    updateAssignee(id: number, userId: number | null) {
        return api.patch<{ data: Submission }>(`/adviser/submissions/${id}`, {
            coordinator_id: userId,
        })
    },

    /**
     * Parse the already-stored document file on the backend (no re-upload needed).
     */
    parseDocument(id: number) {
        return api.get<{ text: string }>(`/adviser/submissions/${id}/parse-document`)
    },

    /**
     * Parse a PDF file and extract its text content.
     */
    parsePdf(id: number, file: File) {
        const form = new FormData()
        form.append('file', file)
        return api.post<{ text: string }>(`/adviser/submissions/${id}/parse-pdf`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
        })
    },

    /**
     * Extract a structured programme profile from raw document text (non-member path).
     */
    extractProfile(id: number, text?: string) {
        return api.post<{ programme_profile: object }>(`/adviser/submissions/${id}/extract-profile`, text ? { text } : {}, { timeout: 60000 })
    },

    /**
     * Generate an AI advisory note for a submission.
     */
    generateAdvisoryNote(id: number, programmeProfile: object, documentText?: string) {
        return api.post(`/adviser/submissions/${id}/generate-advisory-note`, {
            programme_profile: programmeProfile,
            ...(documentText ? { document_text: documentText } : {}),
        }, { timeout: 60000 })
    },

    /**
     * Create a programme entry draft from AI-extracted profile data.
     */
    createProgrammeEntry(id: number, payload: object) {
        return api.post<{ message: string; data: { id: number } }>(
            `/adviser/submissions/${id}/create-programme-entry`,
            payload
        )
    },

    /**
     * Query map entries for overlaps based on programme profile & analysis scope.
     */
    queryOverlap(programmeProfile: object, analysisScope: string = 'full map') {
        return api.post<{ data: any[] }>('/adviser/map/overlap-query', {
            analysis_scope: analysisScope,
            programme_profile: programmeProfile,
        })
    },

    /**
     * AI autofill - Extract programme data from description text or PDF
     */
    aiAutofill(text?: string, file?: File) {
        const form = new FormData()
        if (text) form.append('text', text)
        if (file) form.append('file', file)
        return api.post('/programme-entries/ai-autofill', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        })
    },

    /**
     * AI suggest activities - Get activity suggestions from programme description
     */
    suggestActivities(text?: string, file?: File) {
        const form = new FormData()
        if (text) form.append('text', text)
        if (file) form.append('file', file)
        return api.post('/programme-entries/suggest-activities', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        })
    },

    /**
     * Fetch URL - Extract text content from a URL
     */
    fetchUrl(url: string) {
        return api.post('/programme-entries/fetch-url', { url })
    },

    /**
     * Fetch a single programme entry with full nested activities and locations.
     */
    getProgrammeEntry(id: number) {
        return api.get<{ data: any }>(`/programme-entries/${id}`)
    },

    /**
     * Get the advisory note linked to a programme entry.
     * Returns 404 if no advisory note exists for the entry.
     */
    getByProgrammeEntry(programmeEntryId: number) {
        if (programmeEntryNotePromises.has(programmeEntryId)) {
            return programmeEntryNotePromises.get(programmeEntryId)!
        }
        const promise = api.get<{ data: Submission }>(`/adviser/programme-entries/${programmeEntryId}/advisory-note`)
            .finally(() => programmeEntryNotePromises.delete(programmeEntryId))
        programmeEntryNotePromises.set(programmeEntryId, promise)
        return promise
    },

    /**
     * Request a short-lived download token for the uploaded final note file.
     * Then open: /api/adviser/submissions/{id}/file?token=xxx
     */
    async openFinalNoteFile(id: number) {
        const res = await api.post<{ token: string }>(`/adviser/submissions/${id}/file-token`)
        const token = res.data.token
        const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') ?? ''
        window.open(`${baseUrl}/adviser/submissions/${id}/file?token=${token}`, '_blank')
    },
}
