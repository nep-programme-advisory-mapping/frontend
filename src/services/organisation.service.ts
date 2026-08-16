import api from '../api/axios'
import type {
  Organisation,
  OrganisationListResponse,
  OrganisationActionResponse,
  CreateOrganisationPayload,
  UpdateOrganisationPayload,
} from '@/types/organisations'

export type { Organisation }

const BASE = '/admin/organisations'

export const organisationService = {
  getOrganisations(
    page = 1,
    search = '',
    filters: { status?: string; per_page?: number } = {},
  ) {
    return api.get<OrganisationListResponse>(BASE, {
      params: {
        page,
        search,
        ...filters,
      },
    })
  },

  getOrganisation(id: number) {
    return api.get<Organisation>(`${BASE}/${id}`)
  },

  createOrganisation(payload: CreateOrganisationPayload) {
    return api.post<Organisation>(BASE, {
      name: payload.name,
      contact_name: payload.contact_name,
      email: payload.email,
      member_since: payload.member_since,
    })
  },

  updateOrganisation(
    id: number,
    payload: UpdateOrganisationPayload,
  ) {
    return api.put<OrganisationActionResponse>(
      `${BASE}/${id}`,
      payload,
    )
  },

  uploadLogo(id: number, file: File) {
    const formData = new FormData()
    formData.append('logo', file)
    return api.post<OrganisationActionResponse>(
      `${BASE}/${id}/logo`,
      formData,
      { timeout: 60000 },
    )
  },

  deactivateOrganisation(id: number) {
    return api.patch<OrganisationActionResponse>(
      `${BASE}/${id}/deactivate`,
    )
  },

  reactivateOrganisation(id: number) {
    return api.patch<OrganisationActionResponse>(
      `${BASE}/${id}/activate`,
    )
  },
}