import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adviserApi } from '@/api/adviser.api'
import { userService } from '@/services/user.service'
import type { SubmissionPayload, SubmissionListParams } from '@/types/adviser'
import type { Submission } from '@/types/adviser'

export const useAdviserStore = defineStore('adviser', () => {
    const submissions = ref<Submission[]>([])
    const loading = ref(false)
    const submitting = ref(false)
    const error = ref<string | null>(null)

    const currentPage = ref(1)
    const lastPage = ref(1)
    const total = ref(0)
    const perPage = ref(25)

    // ── Coordinator map (shared) ──────────────────────────────────────────────
    const coordinatorMap = ref<Record<number, string>>({})
    const coordinatorsLoaded = ref(false)
    const isLoadingCoordinators = ref(false)
    const coordinatorError = ref<string | null>(null)
    let _coordinatorsPromise: Promise<void> | null = null

    async function loadCoordinators(force = false) {
        if (!force && coordinatorsLoaded.value) return
        if (!force && _coordinatorsPromise) return _coordinatorsPromise
        isLoadingCoordinators.value = true
        coordinatorsLoaded.value = false
        coordinatorError.value = null
        _coordinatorsPromise = (async () => {
            try {
                const res = await adviserApi.listCoordinators()
                const raw = res.data?.data ?? []
                const map: Record<number, string> = {}
                raw.forEach((u: any) => { map[u.id] = u.name ?? u.email ?? `User ${u.id}` })
                coordinatorMap.value = map
                coordinatorsLoaded.value = true
            } catch (err: any) {
                coordinatorError.value = err?.response?.data?.message || err?.response?.status || err.message || 'Unknown error'
                coordinatorMap.value = {}
            } finally {
                isLoadingCoordinators.value = false
                _coordinatorsPromise = null
            }
        })()
        return _coordinatorsPromise
    }

    function coordinatorLabel(id: number | null): string {
        if (!id) return 'Unassigned'
        return coordinatorMap.value[id] ?? `User #${id}`
    }

    let _fetchSubmissionsPromise: Promise<void> | null = null

    async function fetchSubmissions(params: SubmissionListParams = {}) {
        if (_fetchSubmissionsPromise) return _fetchSubmissionsPromise
        loading.value = true
        error.value = null
        _fetchSubmissionsPromise = (async () => {
        try {
            await loadCoordinators()
            const response = await adviserApi.list({
                page: currentPage.value,
                per_page: perPage.value,
                ...params,
            })
            const paginated = response.data
            submissions.value = paginated.data.map((s: any) => enrichSubmission(s))
            currentPage.value = paginated.current_page
            lastPage.value = paginated.last_page
            total.value = paginated.total
        } catch (err: any) {
            error.value = err?.response?.data?.message ?? 'Failed to load submissions.'
        } finally {
            loading.value = false
            _fetchSubmissionsPromise = null
        }
        })()
        return _fetchSubmissionsPromise
    }

    async function goToPage(page: number, params: SubmissionListParams = {}) {
        currentPage.value = page
        await fetchSubmissions(params)
    }

    function enrichSubmission(s: any): Submission {
        return {
            ...s,
            coordinator_id: s.coordinator_id ?? null,
            coordinator: s.coordinator ?? null,
        }
    }

    async function submitDocument(payload: SubmissionPayload, file?: File): Promise<Submission> {
        submitting.value = true
        error.value = null
        try {
            const response = await adviserApi.submit(payload, file)
            const created = enrichSubmission(response.data.data ?? response.data)
            submissions.value.unshift(created)
            total.value += 1
            return created
        } catch (err: any) {
            error.value = err?.response?.data?.message ?? 'Failed to submit document.'
            throw err
        } finally {
            submitting.value = false
        }
    }

    // ── Parsed document text cache (non-member submissions) ──────────────────
    const parsedDocumentTexts = ref<Record<number, string>>({})

    function storeParsedText(submissionId: number, text: string) {
        parsedDocumentTexts.value[submissionId] = text
    }

    function getParsedText(submissionId: number): string | undefined {
        return parsedDocumentTexts.value[submissionId]
    }

    return {
        submissions,
        loading,
        submitting,
        error,
        currentPage,
        lastPage,
        total,
        perPage,
        coordinatorMap,
        coordinatorsLoaded,
        isLoadingCoordinators,
        coordinatorError,
        coordinatorLabel,
        loadCoordinators,
        fetchSubmissions,
        goToPage,
        submitDocument,
        parsedDocumentTexts,
        storeParsedText,
        getParsedText,
    }
})