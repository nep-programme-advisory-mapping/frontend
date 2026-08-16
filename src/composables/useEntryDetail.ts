import { computed, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEntriesStore } from '@/stores/entries.store'
import { useOrganisationsStore } from '@/stores/organisations'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/utils/toast'
import { adviserApi } from '@/api/adviser.api'
import type { EntryDetail, ActivityRow } from '@/types/entryDetail'
import { unwrapData } from '@/utils/apiHelpers'

export function useEntryDetail(id: Ref<string | undefined>) {
  const router = useRouter()
  const entries = useEntriesStore()
  const organisations = useOrganisationsStore()
  const taxonomy = useTaxonomyStore()
  const auth = useAuthStore()
  const toast = useToast()

  const entry = ref<EntryDetail | null>(null)
  const loading = ref(true)
  const marking = ref(false)
  const advisoryNoteStatus = ref<string | null>(null)

  let activeId: string | null = null

  watch(id, async (newId) => {
    if (!newId) { entry.value = null; loading.value = false; return }
    if (activeId === newId) return
    activeId = newId
    loading.value = true
    try {
      if (taxonomy.categories.length === 0) {
        await taxonomy.fetchTaxonomy()
      }
      entry.value = await entries.fetchById(newId)
      if (auth.userRole === 'member_org' && activeId === newId) {
        try {
          const res = await adviserApi.getByProgrammeEntry(Number(newId))
          const note = unwrapData(res.data)
          advisoryNoteStatus.value = note?.status ?? null
        } catch {
          advisoryNoteStatus.value = null
        }
      }
    } finally {
      if (activeId === newId) loading.value = false
    }
  }, { immediate: true })

  const status = computed(() => entry.value ? (entry.value.isUnverified ? 'unverified' : 'verified') : null)

  const activityRows = computed<ActivityRow[]>(() => {
    if (!entry.value) return []
    return entry.value.activities.map((a) => ({
      ...a,
      item: taxonomy.itemByCode(a.code) ?? null
    }))
  })

  const relatedEntries = computed(() => {
    if (!entry.value) return []
    const myProvinces = new Set(entry.value.locations.map((l) => l.provinceName))
    const myCategories = new Set(entry.value.activities.map((a) => a.code.split('.')[0]))
    return entries.items
      .filter((e) => String(e.id) !== String(entry.value!.id))
      .filter((e) => (
        (e.provinces ?? []).some((p: string) => myProvinces.has(p))
        && (e.activities ?? []).some((a: { code: string }) => myCategories.has(a.code.split('.')[0]))
      ))
      .slice(0, 3)
  })

  async function markVerified() {
    marking.value = true
    await entries.markVerified(entry.value!.id)
    marking.value = false
    toast.success('Entry marked as verified')
  }

  const analysing = ref(false)

  async function analyseInAdviser() {
    if (!entry.value || analysing.value) return
    const entryId = entry.value.id
    const isMember = auth.userRole === 'member_org'
    analysing.value = true
    try {
      const res = await adviserApi.getByProgrammeEntry(Number(entryId))
      const note = unwrapData(res.data)
      if (note?.id) {
        const dest = isMember
          ? { name: 'adviser-entry-detail', params: { entryId: String(entryId) }, state: { note } }
          : { name: 'adviser-detail', params: { id: String(note.id) } }
        router.push(dest)
        return
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        if (isMember) {
          // Members see the friendly "not yet available" message
          router.push({ name: 'adviser-entry-detail', params: { entryId: String(entryId) } })
        } else {
          // Staff: auto-create an advisory note linked to this programme entry
          try {
            const orgName = entry.value.organisationName || 'Unknown Organisation'
            const createRes = await adviserApi.submit({
              submitting_party: orgName,
              document_name: entry.value.name || `Programme Entry #${entryId}`,
              analysis_scope: 'full map',
              programme_entry_id: Number(entryId),
            })
            const created = (createRes.data as any)?.data ?? createRes.data
            router.push({ name: 'adviser-detail', params: { id: String(created.id) } })
          } catch {
            toast.error?.('Failed to create advisory note')
          }
        }
        return
      }
      toast.error?.('Failed to load advisory note')
    } finally {
      analysing.value = false
    }
  }

  return {
    entry,
    loading,
    marking,
    analysing,
    status,
    activityRows,
    relatedEntries,
    markVerified,
    analyseInAdviser,
    organisations,
    auth,
    advisoryNoteStatus,
  }
}
