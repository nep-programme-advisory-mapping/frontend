import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { memberApi } from '@/api/member.api'
import { organisationService } from '@/services/organisation.service'
import { formatRelativeTime } from '@/utils/date'
import { extractPrimaryActivityCodes } from '@/utils/activityHelpers'
import type { Organisation } from '@/types/organisations'
import type { EntryRow } from '@/types/adminProgrammes'

export function useAdminProgrammes() {
  const router = useRouter()

  const activeTab = ref<'submitted' | 'my-drafts' | 'all-drafts'>('submitted')

  const entries = ref<EntryRow[]>([])
  const entriesLoading = ref(false)
  const entriesError = ref('')
  const currentPage = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const selectedOrgName = ref('')

  const myDrafts = ref<EntryRow[]>([])
  const myDraftsLoading = ref(false)
  const myDraftsError = ref('')

  // Every organisation's drafts (backend now scopes /programme-entries/draft
  // this way for organisation-wide-access users) — lets an authorized
  // reviewer find and continue any organisation's draft, not just ones they
  // personally authored. Distinct from myDrafts above, which stays scoped to
  // "only what I created" for whoever prefers that narrower view.
  const allDrafts = ref<EntryRow[]>([])
  const allDraftsLoading = ref(false)
  const allDraftsError = ref('')
  const allDraftsPage = ref(1)
  const allDraftsLastPage = ref(1)

  const orgNameById = ref<Record<number, string>>({})

  const showOrgPicker = ref(false)
  const pickerSearch = ref('')
  const pickerOrgId = ref<number | null>(null)
  const orgsPicker = ref<Organisation[]>([])
  const orgsPickerLoading = ref(false)

  function toOrganisation(value: unknown): Organisation | null {
    if (!value || typeof value !== 'object') return null

    const org = value as Partial<Organisation> & { id?: unknown; name?: unknown }
    const id = Number(org.id)
    const name = typeof org.name === 'string' ? org.name.trim() : ''

    if (!Number.isFinite(id) || !name) return null

    return {
      ...org,
      id,
      name,
      contact_name: org.contact_name ?? '',
      email: org.email ?? '',
      member_since: org.member_since ?? 0,
      status: org.status ?? 'active',
      last_inactive_at: org.last_inactive_at ?? null,
      users_count: org.users_count ?? 0,
      logo_url: org.logo_url ?? null,
      created_at: org.created_at ?? '',
      updated_at: org.updated_at ?? '',
    }
  }

  const orgOptions = computed(() => {
    const names = new Set<string>()
    entries.value.forEach(e => {
      if (e.organisation?.name) names.add(e.organisation.name)
    })
    return Array.from(names).sort()
  })

  const filteredEntries = computed(() => {
    const name = selectedOrgName.value
    if (!name) return entries.value
    return entries.value.filter(e => e.organisation?.name === name)
  })

  const displayTotal = computed(() =>
    selectedOrgName.value ? filteredEntries.value.length : total.value
  )

  let _loadOrgNamesPromise: Promise<void> | null = null

  async function loadOrgNames() {
    if (Object.keys(orgNameById.value).length > 0) return
    if (_loadOrgNamesPromise) return _loadOrgNamesPromise
    _loadOrgNamesPromise = (async () => {
      try {
        const res = await organisationService.getOrganisations(1, '', { per_page: 200 })
        const data = res.data.data ?? []
        if (Array.isArray(data)) {
          const map: Record<number, string> = {}
          for (const o of data) {
            const id = Number((o as any).id)
            const name = ((o as any).name || (o as any).organisation_name) as string | undefined
            if (Number.isFinite(id) && name) map[id] = name
          }
          orgNameById.value = map
        }
      } catch {
        // silently ignore — admin works, coordinator falls back to Org #ID
      } finally {
        _loadOrgNamesPromise = null
      }
    })()
    return _loadOrgNamesPromise
  }

  const filteredPickerOrgs = computed<Organisation[]>(() => {
    const q = pickerSearch.value.toLowerCase()
    return orgsPicker.value.filter((org) => {
      if (q && !org.name.toLowerCase().includes(q)) return false
      return true
    })
  })

  async function loadPickerOrgs() {
    orgsPickerLoading.value = true
    try {
      const res = await organisationService.getOrganisations(1, '', { per_page: 200 })
      orgsPicker.value = (res.data.data ?? [])
        .map((org) => toOrganisation(org))
        .filter((org): org is Organisation => org !== null)
    } catch {
      orgsPicker.value = []
    } finally {
      orgsPickerLoading.value = false
    }
  }

  let _fetchEntriesPromise: Promise<void> | null = null

  async function fetchEntries(page: number) {
    if (_fetchEntriesPromise) return _fetchEntriesPromise
    entriesLoading.value = true
    entriesError.value = ''
    _fetchEntriesPromise = (async () => {
      try {
        const res = await memberApi.getSubmittedProgrammeEntries(page, 200)
        const body = res.data
        entries.value = (body.data || []).map((e: unknown): EntryRow => {
          const entry = e as Record<string, unknown>
          const org = entry.organisation as Record<string, unknown> | null | undefined
          let orgName: string | null = org && typeof org.name === 'string'
            ? org.name
            : (typeof entry.organisation_name === 'string' ? entry.organisation_name : null)
          if (!orgName) {
            const orgId = Number(entry.organisation_id)
            if (Number.isFinite(orgId)) {
              orgName = orgNameById.value[orgId] ?? `Org #${orgId}`
            }
          }
          const primaryActivities = extractPrimaryActivityCodes(entry.activities as any[])

          return {
            id: Number(entry.id),
            programme_name: String(entry.programme_name ?? ''),
            is_submitted: !!entry.is_submitted,
            is_unverified: !!entry.is_unverified,
            start_year: entry.start_year as number | null,
            end_year: entry.end_year as number | null,
            organisation: orgName ? { name: orgName } : null,
            primaryActivities,
            relativeUpdated: formatRelativeTime(entry.updated_at as string) || '—',
          }
        })
        currentPage.value = body.current_page ?? page
        lastPage.value = body.last_page ?? 1
        total.value = body.total ?? 0
      } catch {
        entriesError.value = 'Failed to load entries.'
      } finally {
        entriesLoading.value = false
        _fetchEntriesPromise = null
      }
    })()
    return _fetchEntriesPromise
  }

  function toEntryRow(e: unknown): EntryRow {
    const entry = e as Record<string, unknown>
    const org = entry.organisation as Record<string, unknown> | null | undefined
    let orgName: string | null = org && typeof org.name === 'string'
      ? org.name
      : (typeof entry.organisation_name === 'string' ? entry.organisation_name : null)
    if (!orgName) {
      const orgId = Number(entry.organisation_id)
      if (Number.isFinite(orgId)) {
        orgName = orgNameById.value[orgId] ?? `Org #${orgId}`
      }
    }
    const primaryActivities = extractPrimaryActivityCodes(entry.activities as any[])
    return {
      id: Number(entry.id),
      programme_name: String(entry.programme_name ?? ''),
      is_submitted: !!entry.is_submitted,
      is_unverified: !!entry.is_unverified,
      start_year: entry.start_year as number | null,
      end_year: entry.end_year as number | null,
      organisation: orgName ? { name: orgName } : null,
      primaryActivities,
      relativeUpdated: formatRelativeTime(entry.updated_at as string) || '—',
    }
  }

  async function fetchMyDrafts() {
    myDraftsLoading.value = true
    myDraftsError.value = ''
    try {
      const res = await memberApi.getMyDraftEntries()
      myDrafts.value = (res.data.data || []).map(toEntryRow)
    } catch {
      myDraftsError.value = 'Failed to load drafts.'
    } finally {
      myDraftsLoading.value = false
    }
  }

  async function fetchAllDrafts(page = 1) {
    allDraftsLoading.value = true
    allDraftsError.value = ''
    try {
      const res = await memberApi.getDraftProgrammeEntries(page)
      const body = res.data
      allDrafts.value = (body.data || []).map(toEntryRow)
      allDraftsPage.value = body.current_page ?? page
      allDraftsLastPage.value = body.last_page ?? 1
    } catch {
      allDraftsError.value = 'Failed to load drafts.'
    } finally {
      allDraftsLoading.value = false
    }
  }

  function setTab(tab: 'submitted' | 'my-drafts' | 'all-drafts') {
    activeTab.value = tab
    if (tab === 'my-drafts' && myDrafts.value.length === 0 && !myDraftsLoading.value) {
      fetchMyDrafts()
    }
    if (tab === 'all-drafts' && allDrafts.value.length === 0 && !allDraftsLoading.value) {
      fetchAllDrafts()
    }
  }

  function onOrgFilterChange(e: Event) {
    selectedOrgName.value = (e.target as HTMLSelectElement).value
    currentPage.value = 1
  }

  function setPickerOrgId(id: number | null) {
    pickerOrgId.value = id
  }

  function onPickerSearchInput(e: Event) {
    pickerSearch.value = (e.target as HTMLInputElement).value
  }

  function closeOrgPicker() {
    showOrgPicker.value = false
  }

  function openEntry(id: number) {
    router.push(`/entries/${id}`)
  }

  // Drafts aren't complete enough to render on the read-only detail page
  // (see ProgrammeDashboard.vue's own "Open" button, disabled for drafts for
  // the same reason) — continuing a draft needs the edit wizard instead,
  // loaded via the same ?id= pattern the autosave/edit flow already uses.
  function continueDraft(id: number) {
    router.push(`/entries/new?id=${id}`)
  }

  function openCreatePicker() {
    pickerOrgId.value = null
    pickerSearch.value = ''
    showOrgPicker.value = true
    loadPickerOrgs()
  }

  function confirmCreate() {
    if (!pickerOrgId.value) return
    showOrgPicker.value = false
    router.push({ path: '/entries/new', query: { org_id: String(pickerOrgId.value) } })
  }

  onMounted(async () => {
    const route = router.currentRoute.value
    if (route.query.tab === 'my-drafts' || route.query.tab === 'all-drafts') {
      activeTab.value = route.query.tab
    }
    await loadOrgNames()
    if (activeTab.value === 'my-drafts') {
      fetchMyDrafts()
    } else if (activeTab.value === 'all-drafts') {
      fetchAllDrafts()
    } else {
      fetchEntries(1)
    }
  })

  return reactive({
    activeTab,
    entries,
    filteredEntries,
    entriesLoading,
    entriesError,
    currentPage,
    lastPage,
    total,
    displayTotal,
    orgOptions,
    selectedOrgName,
    myDrafts,
    myDraftsLoading,
    myDraftsError,
    allDrafts,
    allDraftsLoading,
    allDraftsError,
    allDraftsPage,
    allDraftsLastPage,
    showOrgPicker,
    pickerSearch,
    pickerOrgId,
    filteredPickerOrgs,
    orgsPickerLoading,
    setTab,
    setPickerOrgId,
    onPickerSearchInput,
    closeOrgPicker,
    openEntry,
    continueDraft,
    openCreatePicker,
    confirmCreate,
    fetchEntries,
    fetchMyDrafts,
    fetchAllDrafts,
    onOrgFilterChange,
  })
}
