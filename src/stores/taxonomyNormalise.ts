import type { TaxonomyItemStatus } from '@/types/taxonomy'
import type { TaxonomyAdminCategory, TaxonomyAdminSubcategory, TaxonomyAdminItem, OtherQueueEntry } from './taxonomy'

type RawNode = {
  id?: any; code?: string; label?: string; name?: string; status?: TaxonomyItemStatus
  is_active?: boolean; version?: string | number
  usedCount?: number; used_count?: number; used_in_entries?: number; entries_count?: number
  note?: string
  subcategories?: any[]; subCategories?: any[]; sub_categories?: any[]
  items?: any[]; taxonomy_items?: any[]
}

export function normaliseCategories(rawCategories: unknown): TaxonomyAdminCategory[] {
  if (!Array.isArray(rawCategories)) return []
  return rawCategories.map((raw, i) => {
    const r = raw as RawNode
    const categoryCode = r.code || `B${i + 1}`
    const rawSubs = r.subcategories ?? r.subCategories ?? r.sub_categories ?? []
    return {
      id: Number(r.id),
      code: categoryCode,
      label: r.label || r.name || '',
      status: normaliseStatus(r.status, r.is_active),
      subcategories: rawSubs.map((sub: any, si: number) => normaliseSubcategory(sub, categoryCode, si)),
    }
  })
}

export function normaliseSubcategory(raw: RawNode, categoryCode: string, index: number): TaxonomyAdminSubcategory {
  const code = raw.code || `${categoryCode}.${index + 1}`
  const rawItems = raw.items ?? raw.taxonomy_items ?? []
  return {
    id: Number(raw.id),
    code,
    label: raw.label || raw.name || '',
    status: normaliseStatus(raw.status, raw.is_active),
    items: rawItems.map((item: any, ii: number) => normaliseItem(item, code, ii)),
  }
}

export function normaliseItem(raw: RawNode, subcategoryCode: string, index: number): TaxonomyAdminItem {
  return {
    id: Number(raw.id),
    code: raw.code || `${subcategoryCode}.${String(index + 1).padStart(2, '0')}`,
    label: raw.label || raw.name || '',
    status: normaliseStatus(raw.status, raw.is_active),
    version: String(raw.version ?? '1.0'),
    usedCount: raw.usedCount ?? raw.used_count ?? raw.used_in_entries ?? raw.entries_count ?? 0,
    note: raw.note,
  }
}

export function normaliseStatus(status?: TaxonomyItemStatus, isActive = true): TaxonomyItemStatus {
  if (status === 'deprecated') return 'deprecated'
  return isActive === false ? 'deprecated' : 'active'
}

export function toApiNodeType(kind: 'category' | 'subcategory' | 'item') {
  return kind === 'subcategory' ? 'subCategory' : kind
}

export function seedOtherQueue(): OtherQueueEntry[] {
  return [
    { id: 9001, text: 'Menstrual hygiene management sessions', suggestedCategory: 'B1.4', frequency: 7, status: 'pending', categoryCode: 'B1' },
    { id: 9002, text: 'Digital device distribution for remote learning', suggestedCategory: 'B1.2', frequency: 5, status: 'pending', categoryCode: 'B1' },
    { id: 9003, text: 'Peer-to-peer university mentoring', suggestedCategory: 'B5.4', frequency: 2, status: 'dismissed', categoryCode: 'B5' },
    { id: 9004, text: 'School library establishment and book donation', suggestedCategory: 'B1.5', frequency: 4, status: 'dismissed', categoryCode: 'B1' },
    { id: 9005, text: 'Community radio education broadcasts', suggestedCategory: 'B5.2', frequency: 1, status: 'dismissed', categoryCode: 'B5' },
  ]
}

const CACHE_KEY = 'nep_admin_taxonomy_store_cache_v1'
const OTHER_QUEUE_CACHE_KEY = 'nep_admin_taxonomy_other_queue_cache_v1'

export function readCache(): TaxonomyAdminCategory[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') } catch { return [] }
}
export function writeCache(categories: TaxonomyAdminCategory[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(categories))
}
export function readOtherQueueCache(): OtherQueueEntry[] {
  try { return JSON.parse(localStorage.getItem(OTHER_QUEUE_CACHE_KEY) || '[]') } catch { return [] }
}
export function writeOtherQueueCache(entries: OtherQueueEntry[]) {
  localStorage.setItem(OTHER_QUEUE_CACHE_KEY, JSON.stringify(entries))
}
