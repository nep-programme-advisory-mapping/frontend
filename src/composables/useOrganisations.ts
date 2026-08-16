import { ref } from 'vue'
import { organisationService } from '@/services/organisation.service'
import type { Organisation, OrganisationForm } from '@/types/organisations'

export function useOrganisations() {
  const organisations = ref<Organisation[]>([])
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
      const res = await organisationService.getOrganisations(page, search.value)
      organisations.value = res.data.data
      currentPage.value = res.data.current_page
      lastPage.value = res.data.last_page
      total.value = res.data.total
    } catch {
      error.value = 'Failed to load organisations'
    } finally {
      loading.value = false
    }
  }

  const create = async (data: OrganisationForm) => {
    saving.value = true
    try {
      const res = await organisationService.createOrganisation(data)
      let newOrg = res.data
      if (data.logoFile) {
        try {
          const logoRes = await organisationService.uploadLogo(newOrg.id, data.logoFile)
          newOrg = logoRes.data.organisation
        } catch {
          throw new Error('logo_upload_failed')
        }
      }
      await fetchOrganisations(1)
    } finally {
      saving.value = false
    }
  }

  const update = async (id: number, data: OrganisationForm) => {
    saving.value = true
    try {
      await organisationService.updateOrganisation(id, data)
      if (data.logoFile) {
        try {
          await organisationService.uploadLogo(id, data.logoFile)
        } catch {
          throw new Error('logo_upload_failed')
        }
      }
      await fetchOrganisations(currentPage.value)
    } finally {
      saving.value = false
    }
  }

  const activate = async (id: number) => {
    await organisationService.reactivateOrganisation(id)
    await fetchOrganisations(currentPage.value)
  }

  const deactivate = async (id: number) => {
    await organisationService.deactivateOrganisation(id)
    await fetchOrganisations(currentPage.value)
  }

  return {
    organisations,
    loading,
    saving,
    error,
    currentPage,
    lastPage,
    total,
    search,
    fetchOrganisations,
    create,
    update,
    activate,
    deactivate,
  }
}
