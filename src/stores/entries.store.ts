import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import { monthsSince, formatRelativeTime } from '@/utils/date'
import { extractPrimaryActivityCodes } from '@/utils/activityHelpers'
import { mapEntry, mapDetailEntry } from './entriesMapper'
import type { ProgrammeIdentity } from '@/types/programme'

export type { mapEntry, mapDetailEntry }

export interface EntryWithStatus extends ProgrammeIdentity {
  status: string
  statusVariant: 'warning' | 'success'
  unverifiedLabel: string
  provincesDisplay: string
  hasMoreProvinces: boolean
  moreProvincesCount: number
  primaryCodes: string[]
  relativeLastUpdated: string
}

export interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const useEntriesStore = defineStore('entries', () => {
  const activeTab = ref<'all' | 'draft' | 'submitted'>('all')

  const allItems = ref<ProgrammeIdentity[]>([])
  const draftItems = ref<ProgrammeIdentity[]>([])
  const submittedItems = ref<ProgrammeIdentity[]>([])
  const allLoading = ref(false)
  const draftLoading = ref(false)
  const submittedLoading = ref(false)
  const allError = ref('')
  const draftError = ref('')
  const submittedError = ref('')
  const allPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })
  const draftPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })
  const submittedPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })
  const entryCache = ref<Record<string, any>>({})

  const currentItems = computed(() =>
    activeTab.value === 'all' ? allItems.value : activeTab.value === 'draft' ? draftItems.value : submittedItems.value
  )
  const currentLoading = computed(() =>
    activeTab.value === 'all' ? allLoading.value : activeTab.value === 'draft' ? draftLoading.value : submittedLoading.value
  )
  const currentError = computed(() =>
    activeTab.value === 'all' ? allError.value : activeTab.value === 'draft' ? draftError.value : submittedError.value
  )
  const currentPagination = computed(() =>
    activeTab.value === 'all' ? allPagination.value : activeTab.value === 'draft' ? draftPagination.value : submittedPagination.value
  )
  const items = computed<any[]>(() => [...allItems.value, ...draftItems.value, ...submittedItems.value])

  const entriesWithStatus = computed<EntryWithStatus[]>(() =>
    currentItems.value.map(entry => {
      const provinces = entry.provinces || []
      return {
        ...entry,
        status: entry.isUnverified ? 'Unverified' : 'Verified',
        statusVariant: (entry.isUnverified ? 'warning' : 'success') as 'warning' | 'success',
        unverifiedLabel: `Unverified — ${monthsSince(entry.lastUpdated)} months`,
        provincesDisplay: provinces.slice(0, 2).join(', '),
        hasMoreProvinces: provinces.length > 2,
        moreProvincesCount: provinces.length - 2,
        primaryCodes: extractPrimaryActivityCodes(entry.activities),
        relativeLastUpdated: formatRelativeTime(entry.lastUpdated) || '—',
      }
    })
  )

  const verifiedCount = computed(() => currentItems.value.filter(e => !e.isUnverified).length)
  const unverifiedCount = computed(() => currentItems.value.filter(e => e.isUnverified).length)

  function statusOf(entry: ProgrammeIdentity): 'verified' | 'unverified' {
    return entry.isUnverified ? 'unverified' : 'verified'
  }

  function byId(id: string | number | undefined): any {
    if (id == null) return null
    return entryCache.value[String(id)] || null
  }

  const fetchPromises = new Map<string, Promise<any>>()

  async function fetchById(id: string | number): Promise<any> {
    const key = String(id)
    if (entryCache.value[key]) return entryCache.value[key]
    if (fetchPromises.has(key)) return fetchPromises.get(key)
    const promise = memberApi.getProgrammeEntry(id)
      .then(res => { const mapped = mapDetailEntry(res.data.data ?? res.data); entryCache.value[key] = mapped; fetchPromises.delete(key); return mapped })
      .catch(err => { fetchPromises.delete(key); throw err })
    fetchPromises.set(key, promise)
    return promise
  }

  async function refreshById(id: string | number): Promise<any> {
    const key = String(id)
    fetchPromises.delete(key)
    delete entryCache.value[key]
    const res = await memberApi.getProgrammeEntry(id)
    const mapped = mapDetailEntry(res.data.data ?? res.data)
    entryCache.value = { ...entryCache.value, [key]: mapped }
    return mapped
  }

  async function markVerified(id: string | number) {
    try {
      await memberApi.markVerified(id)
      const entry = items.value.find(e => String(e.id) === String(id))
      if (entry) entry.isUnverified = false
    } catch { /* ignore */ }
  }

  let allPromise: Promise<void> | null = null
  let draftPromise: Promise<void> | null = null
  let submittedPromise: Promise<void> | null = null

  async function fetchAllEntries(page = 1) {
    if (allPromise) return allPromise
    allPromise = _fetch('all', page).finally(() => { allPromise = null })
    return allPromise
  }
  async function fetchDraftEntries(page = 1) {
    if (draftPromise) return draftPromise
    draftPromise = _fetch('draft', page).finally(() => { draftPromise = null })
    return draftPromise
  }
  async function fetchSubmittedEntries(page = 1) {
    if (submittedPromise) return submittedPromise
    submittedPromise = _fetch('submitted', page).finally(() => { submittedPromise = null })
    return submittedPromise
  }

  async function _fetch(type: 'all' | 'draft' | 'submitted', page: number) {
    const loadingRef = type === 'all' ? allLoading : type === 'draft' ? draftLoading : submittedLoading
    const errorRef = type === 'all' ? allError : type === 'draft' ? draftError : submittedError
    const itemsRef = type === 'all' ? allItems : type === 'draft' ? draftItems : submittedItems
    const paginationRef = type === 'all' ? allPagination : type === 'draft' ? draftPagination : submittedPagination
    const apiFn = type === 'all' ? memberApi.getAllProgrammeEntries : type === 'draft' ? memberApi.getDraftProgrammeEntries : memberApi.getSubmittedProgrammeEntries

    loadingRef.value = true
    errorRef.value = ''
    try {
      const body = (await apiFn(page)).data
      itemsRef.value = (body.data || []).map(mapEntry)
      paginationRef.value = { currentPage: body.current_page ?? page, lastPage: body.last_page ?? 0, total: body.total ?? 0 }
    } catch (err: any) {
      errorRef.value = err?.response?.data?.message || `Failed to load ${type} entries.`
      itemsRef.value = []
    } finally {
      loadingRef.value = false
    }
  }

  function switchTab(tab: 'all' | 'draft' | 'submitted', force = false) {
    activeTab.value = tab
    if (tab === 'all' && (force || allItems.value.length === 0)) fetchAllEntries(1)
    else if (tab === 'draft' && (force || draftItems.value.length === 0)) fetchDraftEntries(1)
    else if (tab === 'submitted' && (force || submittedItems.value.length === 0)) fetchSubmittedEntries(1)
  }

  function goToPage(page: number) {
    const p = currentPagination.value
    if (page >= 1 && page <= p.lastPage) {
      if (activeTab.value === 'all') fetchAllEntries(page)
      else if (activeTab.value === 'draft') fetchDraftEntries(page)
      else fetchSubmittedEntries(page)
    }
  }

  function retry() { goToPage(currentPagination.value.currentPage) }
  function forOrganisation(_orgId: number | null) { return [] }
  async function refreshAfterSave(isSubmitted: boolean) {
    await Promise.allSettled([
      fetchAllEntries(1),
      isSubmitted ? fetchSubmittedEntries(1) : fetchDraftEntries(1),
    ])
  }
  function clearEntryCache(id?: string | number) {
    if (id == null) {
      entryCache.value = {}
      return
    }
    const next = { ...entryCache.value }
    delete next[String(id)]
    entryCache.value = next
  }

  return {
    activeTab, allItems, draftItems, submittedItems,
    allLoading, draftLoading, submittedLoading,
    allError, draftError, submittedError,
    allPagination, draftPagination, submittedPagination,
    currentItems, items, currentLoading, currentError, currentPagination,
    entriesWithStatus, verifiedCount, unverifiedCount,
    statusOf, byId, fetchById, refreshById, markVerified,
    fetchAllEntries, fetchDraftEntries, fetchSubmittedEntries, refreshAfterSave,
    switchTab, goToPage, retry, forOrganisation, clearEntryCache,
  }
})
