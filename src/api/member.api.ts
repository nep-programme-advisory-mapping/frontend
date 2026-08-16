import api from './axios';
import { taxonomyApi } from './taxonomy.api';
import type { ProgrammeIdentity, Province, District, Commune, Village } from '@/types/programme'

const provinceRequestCache = new Map<string, ReturnType<typeof api.get<{ data: Province[] }>>>()
const districtRequestCache = new Map<string, ReturnType<typeof api.get<{ data: District[] }>>>()
const communeRequestCache = new Map<string, ReturnType<typeof api.get<{ data: Commune[] }>>>()
const villageRequestCache = new Map<string, ReturnType<typeof api.get<{ data: Village[] }>>>()

function rememberRequest<K, T>(
  cache: Map<K, ReturnType<typeof api.get<T>>>,
  key: K,
  request: () => ReturnType<typeof api.get<T>>
) {
  const cached = cache.get(key)
  if (cached) return cached

  const pending = request().catch(error => {
    cache.delete(key)
    throw error
  })
  cache.set(key, pending)
  return pending
}

export const memberApi = {
  listProgrammeEntries(organisationId: number | string) {
    return api.get(`/organisations/${organisationId}/programme-entries`);
  },
  createProgrammeEntry(data: ProgrammeIdentity, organisationId?: number | string) {
    return api.post('/programme-entries', { ...data, ...(organisationId ? { organisation_id: organisationId } : {}) });
  },
  updateProgrammeEntry(id: number | string, data: ProgrammeIdentity) {
    return api.put(`/programme-entries/${id}`, data);
  },
  getProgrammeEntry(id: number | string) {
    return api.get(`/programme-entries/${id}`);
  },
  getProvinces() {
    return rememberRequest(provinceRequestCache, 'all', () => api.get<{ data: Province[] }>('/provinces'));
  },
  getDistricts(provinceId: number | string) {
    const id = String(provinceId)
    return rememberRequest(districtRequestCache, id, () => api.get<{ data: District[] }>(`/provinces/${id}/districts`));
  },
  getCommunes(districtId: number | string) {
    const id = String(districtId)
    return rememberRequest(communeRequestCache, id, () => api.get<{ data: Commune[] }>(`/districts/${id}/communes`));
  },
  getVillages(communeId: number | string) {
    const id = String(communeId)
    return rememberRequest(villageRequestCache, id, () => api.get<{ data: Village[] }>(`/communes/${id}/villages`));
  },
  getMapEntries() {
    return api.get('/map/entries');
  },
  saveGovernmentAgreements(id: number | string, agreements: any[]) {
    return api.put(`/programme-entries/${id}/government-agreements`, { agreements });
  },
  getGovernmentAgreements(id: number | string) {
    return api.get(`/programme-entries/${id}/government-agreements`);
  },
  saveActivities(id: number | string, activities: any[]) {
    return api.post(`/programme-entries/${id}/activities`, { activities });
  },
  getActivities(id: number | string) {
    return api.get(`/programme-entries/${id}/activities`);
  },
  saveGeography(id: number | string, data: any) {
    return api.put(`/programme-entries/${id}/geography`, data);
  },
  getGeography(id: number | string) {
    return api.get(`/programme-entries/${id}/geography`);
  },
  getAllProgrammeEntries(page = 1) {
    return api.get(`/programme-entries?page=${page}`);
  },
  getAdminAllProgrammeEntries(page = 1, organisationId?: number | null) {
    const params: Record<string, any> = { page }
    if (organisationId) params.organisation_id = organisationId
    return api.get('/programme-entries', { params })
  },
  getDraftProgrammeEntries(page = 1) {
    return api.get(`/programme-entries/draft?page=${page}`);
  },
  getSubmittedProgrammeEntries(page = 1, perPage?: number) {
    const params: Record<string, any> = { page }
    if (perPage) params.per_page = perPage
    return api.get('/programme-entries/submitted', { params })
  },
  getMyDraftEntries() {
    return api.get('/programme-entries/my-drafts')
  },
  saveKeywords(id: number | string, keywords: string[]) {
    return api.put(`/programme-entries/${id}/keywords`, { keywords });
  },
  getTaxonomyCategories() {
    return taxonomyApi.list();
  },
  getMyOrganisation() {
    return api.get('/organisations/me');
  },
  updateMyOrganisation(payload: { contact_name?: string; email?: string }) {
    return api.patch('/organisations/me', payload);
  },
  getDraftProgrammeEntry(id: number | string) {
    return api.get(`/programme-entries/${id}`);
  },
  markVerified(id: number | string) {
    return api.patch(`/programme-entries/${id}/verify`);
  },
  listOrganisations() {
    return api.get('/organisations');
  },
  listAllOrganisations() {
    return api.get('/organisations', { params: { per_page: 200 } });
  },
  fetchUrlContent(url: string) {
    return api.post<{ text: string }>('/programme-entries/fetch-url', { url });
  },
  aiAutofill(payload: FormData | { text: string }) {
    return api.post('/programme-entries/ai-autofill', payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      timeout: 60000,
    });
  },
  suggestActivities(payload: FormData | { text: string }) {
    return api.post('/programme-entries/suggest-activities', payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      timeout: 60000,
    });
  },
};
