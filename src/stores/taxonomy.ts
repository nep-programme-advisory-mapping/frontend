import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { taxonomyApi } from '@/api/taxonomy.api'
import type { TaxonomyItemStatus, TaxonomyNodeType } from '@/types/taxonomy'
import { mockTaxonomies } from '@/constants/taxonomy'
import type { Category, SubCategory, TaxonomyItem } from '@/types/taxonomy'

export interface TaxonomyAdminItem {
  id: number
  code: string
  label: string
  status: TaxonomyItemStatus
  version: string
  usedCount: number
  note?: string
}

export interface TaxonomyAdminSubcategory {
  id: number
  code: string
  label: string
  status: TaxonomyItemStatus
  items: TaxonomyAdminItem[]
}

export interface TaxonomyAdminCategory {
  id: number
  code: string
  label: string
  status: TaxonomyItemStatus
  subcategories: TaxonomyAdminSubcategory[]
}

export interface OtherQueueEntry {
  id: number
  text: string
  suggestedCategory: string
  frequency: number
  status: 'pending' | 'promoted' | 'dismissed'
  categoryCode?: string
  subcategoryLabel?: string
}

export interface AddTaxonomyItemPayload {
  categoryCode: string
  subcategoryCode: string
  subcategoryLabel: string
  label: string
}

export interface PromoteOtherEntryPayload {
  categoryCode: string
  subcategoryCode: string
  subcategoryLabel: string
}

export type TaxonomyAdminNodeKind = 'category' | 'subcategory' | 'item'

type RawCategory = Category & {
  code?: string
  label?: string
  status?: TaxonomyItemStatus
  version?: string | number
  usedCount?: number
  used_count?: number
  used_in_entries?: number
  entries_count?: number
  subcategories?: RawSubcategory[]
  sub_categories?: RawSubcategory[]
}

type RawSubcategory = SubCategory & {
  code?: string
  label?: string
  status?: TaxonomyItemStatus
  version?: string | number
  usedCount?: number
  used_count?: number
  used_in_entries?: number
  entries_count?: number
  taxonomy_items?: RawTaxonomyItem[]
}

type RawTaxonomyItem = TaxonomyItem & {
  code?: string
  label?: string
  status?: TaxonomyItemStatus
  version?: string | number
  usedCount?: number
  used_count?: number
  used_in_entries?: number
  entries_count?: number
  note?: string
}

const CACHE_KEY = 'nep_admin_taxonomy_store_cache_v1'
const OTHER_QUEUE_CACHE_KEY = 'nep_admin_taxonomy_other_queue_cache_v1'

export const useTaxonomyStore = defineStore('taxonomy', () => {
  const categories = ref<TaxonomyAdminCategory[]>([])
  const otherQueue = ref<OtherQueueEntry[]>(readOtherQueueCache())
  const loading = ref(false)

  const pendingOtherEntries = computed(() =>
    otherQueue.value.filter((entry) => entry.status === 'pending'),
  )

  async function fetchTaxonomy(options: { force?: boolean } = {}) {
    if (categories.value.length && !options.force) {
      await fetchOtherQueue()
      return
    }

    loading.value = true
    const cached = options.force ? [] : readCache()
    if (cached.length) {
      categories.value = cached
      await fetchOtherQueue()
      loading.value = false
      return
    }

    try {
      categories.value = normaliseCategories(await taxonomyApi.list(options))
      writeCache(categories.value)
    } catch {
      if (!categories.value.length) {
        categories.value = normaliseCategories(mockTaxonomies)
      }
    } finally {
      await fetchOtherQueue()
      loading.value = false
    }
  }

  async function refreshTaxonomy() {
    await fetchTaxonomy({ force: true })
  }

  function upsertOtherQueueEntry(entry: OtherQueueEntry) {
    const index = otherQueue.value.findIndex((item) => item.id === entry.id)

    if (index >= 0) {
      otherQueue.value[index] = {
        ...otherQueue.value[index],
        ...entry,
        frequency: Math.max(otherQueue.value[index]?.frequency ?? 1, entry.frequency),
      }
    } else {
      otherQueue.value.unshift(entry)
    }

    writeOtherQueueCache(otherQueue.value)
  }

  async function addItem(payload: AddTaxonomyItemPayload) {
    loading.value = true
    try {
      otherQueue.value.unshift({
        id: Date.now() + 1,
        text: payload.label.trim(),
        suggestedCategory: payload.subcategoryCode,
        frequency: 1,
        status: 'pending',
        categoryCode: payload.categoryCode,
        subcategoryLabel: payload.subcategoryLabel,
      })
      writeOtherQueueCache(otherQueue.value)
    } finally {
      loading.value = false
    }
  }

  async function setItemStatus(code: string, status: TaxonomyItemStatus) {
    const item = findItemByCode(code)
    if (!item) return

    loading.value = true
    try {
      await taxonomyApi.setItemStatus(item.id, status)
    } catch {
      // Local cache fallback for frontend review.
    } finally {
      item.status = status
      writeCache(categories.value)
      loading.value = false
    }
  }

  async function renameEntry(kind: TaxonomyAdminNodeKind, id: number, label: string) {
    const node = findNodeById(kind, id)
    if (!node) return

    loading.value = true
    try {
      await taxonomyApi.rename(toApiNodeType(kind), id, { label })
      node.label = label
      writeCache(categories.value)
    } finally {
      loading.value = false
    }
  }

  async function deprecateEntry(kind: TaxonomyAdminNodeKind, id: number) {
    const node = findNodeById(kind, id)
    if (!node) return

    loading.value = true
    try {
      await taxonomyApi.deprecate(toApiNodeType(kind), id)
      node.status = 'deprecated'
      writeCache(categories.value)
    } finally {
      loading.value = false
    }
  }

  async function restoreEntry(kind: TaxonomyAdminNodeKind, id: number) {
    const node = findNodeById(kind, id)
    if (!node) return

    loading.value = true
    try {
      await taxonomyApi.reactivate(toApiNodeType(kind), id)
      node.status = 'active'
      writeCache(categories.value)
    } finally {
      loading.value = false
    }
  }

  async function promoteOtherEntry(id: number, payload: PromoteOtherEntryPayload) {
    const entry = otherQueue.value.find((item) => item.id === id)
    if (!entry) return

    loading.value = true
    try {
      await createStandardItem({
        categoryCode: payload.categoryCode,
        subcategoryCode: payload.subcategoryCode,
        subcategoryLabel: payload.subcategoryLabel,
        label: entry.text,
      })
      entry.status = 'promoted'
      writeOtherQueueCache(otherQueue.value)
    } finally {
      loading.value = false
    }
  }

  async function dismissOtherEntry(id: number) {
    const entry = otherQueue.value.find((item) => item.id === id)
    if (entry) {
      entry.status = 'dismissed'
      writeOtherQueueCache(otherQueue.value)
    }
  }

  async function fetchOtherQueue() {
    if (!otherQueue.value.length) {
      otherQueue.value = seedOtherQueue()
      writeOtherQueueCache(otherQueue.value)
    }
  }

  async function createStandardItem(payload: AddTaxonomyItemPayload) {
    const category = categories.value.find((entry) => entry.code === payload.categoryCode)
    if (!category) return

    const targetSubCodeClean = payload.subcategoryCode.trim().toLowerCase()
    let subcategory = category.subcategories.find((entry) => entry.code.trim().toLowerCase() === targetSubCodeClean)

    if (!subcategory) {
      subcategory = {
        id: Date.now(),
        code: payload.subcategoryCode.trim().toUpperCase(),
        label: payload.subcategoryLabel || payload.subcategoryCode,
        status: 'active',
        items: [],
      }

      try {
        const createdSubcategory = await taxonomyApi.createSubCategory({
          label: subcategory.label,
          name: subcategory.label,
          code: subcategory.code,
          category_id: category.id,
        })
        if (createdSubcategory && (createdSubcategory as any).id) {
          subcategory = normaliseSubcategory(
            createdSubcategory,
            category.code,
            category.subcategories.length,
          )
        }
      } catch (err) {
        console.warn('Backend subcategory creation fallback to local state:', err)
      }

      category.subcategories.push(subcategory)
    }

    let item: TaxonomyAdminItem
    const nextIndex = subcategory.items.length + 1
    const itemCode = `${subcategory.code}.${String(nextIndex).padStart(2, '0')}`

    try {
      const createdItem = await taxonomyApi.createItem({
        label: payload.label.trim(),
        name: payload.label.trim(),
        code: itemCode,
        sub_category_id: subcategory.id,
        subcategory_id: subcategory.id,
      })
      if (createdItem && (createdItem as any).id) {
        item = normaliseItem(createdItem, subcategory.code, subcategory.items.length)
      } else {
        throw new Error('Invalid item response')
      }
    } catch (err) {
      console.warn('Backend item creation fallback to local state:', err)
      item = {
        id: Date.now() + 1,
        code: itemCode,
        label: payload.label.trim(),
        status: 'active',
        version: '1.0',
        usedCount: 0,
      }
    }

    subcategory.items.push(item)
    writeCache(categories.value)
  }

  function findItemByCode(code: string) {
    for (const category of categories.value) {
      for (const subcategory of category.subcategories) {
        const item = subcategory.items.find((entry) => entry.code === code)
        if (item) return item
      }
    }
    return null
  }

  function findNodeById(kind: TaxonomyAdminNodeKind, id: number) {
    for (const category of categories.value) {
      if (kind === 'category' && category.id === id) return category
      for (const subcategory of category.subcategories) {
        if (kind === 'subcategory' && subcategory.id === id) return subcategory
        const item = subcategory.items.find((entry) => entry.id === id)
        if (kind === 'item' && item) return item
      }
    }
    return null
  }

  return {
    categories,
    otherQueue,
    pendingOtherEntries,
    loading,
    fetchTaxonomy,
    refreshTaxonomy,
    fetchOtherQueue,
    upsertOtherQueueEntry,
    addItem,
    createStandardItem,
    setItemStatus,
    renameEntry,
    deprecateEntry,
    restoreEntry,
    promoteOtherEntry,
    dismissOtherEntry,
    itemByCode: findItemByCode,
  }
})

function readCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? (JSON.parse(cached) as TaxonomyAdminCategory[]) : []
  } catch {
    return []
  }
}

function writeCache(categories: TaxonomyAdminCategory[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(categories))
}

function readOtherQueueCache() {
  try {
    const cached = localStorage.getItem(OTHER_QUEUE_CACHE_KEY)
    return cached ? (JSON.parse(cached) as OtherQueueEntry[]) : []
  } catch {
    return []
  }
}

function writeOtherQueueCache(entries: OtherQueueEntry[]) {
  localStorage.setItem(OTHER_QUEUE_CACHE_KEY, JSON.stringify(entries))
}

function normaliseCategories(rawCategories: unknown): TaxonomyAdminCategory[] {
  if (!Array.isArray(rawCategories)) return []

  return rawCategories.map((rawCategory, categoryIndex) => {
    const category = rawCategory as RawCategory
    const categoryCode = category.code || `B${categoryIndex + 1}`
    const rawSubcategories = category.subcategories ?? category.subCategories ?? category.sub_categories ?? []

    return {
      id: Number(category.id),
      code: categoryCode,
      label: category.label || category.name,
      status: normaliseStatus(category.status, category.is_active),
      subcategories: rawSubcategories.map((subcategory, subcategoryIndex) =>
        normaliseSubcategory(subcategory, categoryCode, subcategoryIndex),
      ),
    }
  })
}

function normaliseSubcategory(
  rawSubcategory: RawSubcategory,
  categoryCode: string,
  subcategoryIndex: number,
): TaxonomyAdminSubcategory {
  const subcategoryCode = rawSubcategory.code || `${categoryCode}.${subcategoryIndex + 1}`
  const rawItems = rawSubcategory.items ?? rawSubcategory.taxonomy_items ?? []

  return {
    id: Number(rawSubcategory.id),
    code: subcategoryCode,
    label: rawSubcategory.label || rawSubcategory.name,
    status: normaliseStatus(rawSubcategory.status, rawSubcategory.is_active),
    items: rawItems.map((item, itemIndex) => normaliseItem(item, subcategoryCode, itemIndex)),
  }
}

function normaliseItem(
  rawItem: RawTaxonomyItem,
  subcategoryCode: string,
  itemIndex: number,
): TaxonomyAdminItem {
  return {
    id: Number(rawItem.id),
    code: rawItem.code || `${subcategoryCode}.${String(itemIndex + 1).padStart(2, '0')}`,
    label: rawItem.label || rawItem.name,
    status: normaliseStatus(rawItem.status, rawItem.is_active),
    version: String(rawItem.version ?? '1.0'),
    usedCount:
      rawItem.usedCount ??
      rawItem.used_count ??
      rawItem.used_in_entries ??
      rawItem.entries_count ??
      0,
    note: rawItem.note,
  }
}

function seedOtherQueue(): OtherQueueEntry[] {
  return [
    {
      id: 9001,
      text: 'Menstrual hygiene management sessions',
      suggestedCategory: 'B1.4',
      frequency: 7,
      status: 'pending',
      categoryCode: 'B1',
    },
    {
      id: 9002,
      text: 'Digital device distribution for remote learning',
      suggestedCategory: 'B1.2',
      frequency: 5,
      status: 'pending',
      categoryCode: 'B1',
    },
    {
      id: 9003,
      text: 'Peer-to-peer university mentoring',
      suggestedCategory: 'B5.4',
      frequency: 2,
      status: 'dismissed',
      categoryCode: 'B5',
    },
    {
      id: 9004,
      text: 'School library establishment and book donation',
      suggestedCategory: 'B1.5',
      frequency: 4,
      status: 'dismissed',
      categoryCode: 'B1',
    },
    {
      id: 9005,
      text: 'Community radio education broadcasts',
      suggestedCategory: 'B5.2',
      frequency: 1,
      status: 'dismissed',
      categoryCode: 'B5',
    },
  ]
}

function normaliseStatus(status?: TaxonomyItemStatus, isActive = true): TaxonomyItemStatus {
  if (status === 'deprecated') return 'deprecated'
  return isActive === false ? 'deprecated' : 'active'
}

function toApiNodeType(kind: TaxonomyAdminNodeKind): TaxonomyNodeType {
  return kind === 'subcategory' ? 'subCategory' : kind
}

