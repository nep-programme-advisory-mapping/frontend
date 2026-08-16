import { defineStore } from 'pinia'
import { ref } from 'vue'
import { organisationService } from '@/services/organisation.service'
import { memberApi } from '@/api/member.api'
import { unwrapData } from '@/utils/apiHelpers'
import type { OrganisationForm } from '@/types/organisations'

export const useOrganisationsStore = defineStore('organisations', () => {
  const organisations = ref<any[]>([])
  const items = ref<any[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const search = ref('')

  const fetchOrganisations = async (page = 1) => {
    loading.value = true
    error.value = null
    try {
      const res = await organisationService.getOrganisations(page, search.value, { per_page: 16 })
      organisations.value = res.data.data
      items.value = res.data.data
      currentPage.value = res.data.current_page
      lastPage.value = res.data.last_page
      total.value = res.data.total
    } catch (err: any) {
      error.value = err?.response?.data?.message || 'Failed to load organisations'
    } finally {
      loading.value = false
    }
  }

  async function fetch() {
    try {
      const response = await memberApi.listOrganisations()
      const data = response.data.data ?? response.data ?? []
      items.value = Array.isArray(data) ? data : []
    } catch {
      items.value = []
    }
  }

  function byId(id: number | string) {
    return items.value.find((o) => String(o.id) === String(id)) || null
  }

  function nameOf(id: number | string): string {
    const org = byId(id)
    return org?.name || org?.organisation_name || ''
  }

  const patchLocal = (updated: any) => {
    const idx = organisations.value.findIndex((o) => o.id === updated.id)
    if (idx !== -1) {
      organisations.value[idx] = updated
    } else {
      organisations.value.unshift(updated)
    }
  }

  const create = async (data: OrganisationForm) => {
    saving.value = true
    try {
      const payload = {
        name: data.name,
        email: data.email,
        contact_name: data.contact_name,
        member_since: data.member_since,
      }
      const res = await organisationService.createOrganisation(payload)
      let created = unwrapData(res.data)
      if (data.logoFile) {
        try {
          const logoRes = await organisationService.uploadLogo(created.id, data.logoFile)
          created = (logoRes.data as any)?.organisation ?? logoRes.data ?? created
        } catch (e) {
          console.error('[uploadLogo] failed:', e)
        }
      }

      patchLocal(created)
      return created
    } finally {
      saving.value = false
    }
  }

  const update = async (id: number, data: OrganisationForm) => {
    saving.value = true
    try {
      const current = organisations.value.find((o) => o.id === id)
      const payload: Record<string, any> = {}

      if (data.name !== current?.name) payload.name = data.name
      if (data.email !== current?.email) payload.email = data.email
      if (data.contact_name !== current?.contact_name) payload.contact_name = data.contact_name
      if (data.member_since !== current?.member_since) payload.member_since = data.member_since

      let updated = current
      if (Object.keys(payload).length > 0) {
        const res = await organisationService.updateOrganisation(id, payload)
        updated = res.data.organisation ?? res.data
      } else {
        updated = current
      }

      if (data.logoFile) {
        try {
          const logoRes = await organisationService.uploadLogo(id, data.logoFile)
          updated = logoRes.data.organisation ?? logoRes.data ?? updated
        } catch (e: any) {
          console.error('[uploadLogo] failed:', e)
          console.error('[uploadLogo] response data:', e?.response?.data)
          console.error('[uploadLogo] response status:', e?.response?.status)
          throw new Error('logo_upload_failed')
        }
      }

      patchLocal(updated)
    } finally {
      saving.value = false
    }
  }

  const activate = async (id: number) => {
    const res = await organisationService.reactivateOrganisation(id)
    patchLocal(res.data)
  }

  const deactivate = async (id: number) => {
    const res = await organisationService.deactivateOrganisation(id)
    patchLocal(res.data)
  }

  return {
    organisations,
    items,
    loading,
    saving,
    error,
    currentPage,
    lastPage,
    total,
    search,
    fetchOrganisations,
    fetch,
    byId,
    nameOf,
    create,
    update,
    activate,
    deactivate,
  }
})
