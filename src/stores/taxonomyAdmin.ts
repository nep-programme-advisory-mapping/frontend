import { defineStore } from 'pinia'
import { ref, watch, computed, reactive } from 'vue'
import { useTaxonomyStore, type OtherQueueEntry, type TaxonomyAdminNodeKind } from './taxonomy'
import { useToast } from '@/utils/toast'

export type TaxonomyRow = {
  id: number
  kind: TaxonomyAdminNodeKind
  code: string
  label: string
  status: 'active' | 'deprecated'
  version: string
  usedCount: number | string
  note?: string
  categoryCode?: string
  subcategoryCode?: string
  subcategoryLabel?: string
}

export const useTaxonomyAdminStore = defineStore('taxonomyAdmin', () => {
  const taxonomy = useTaxonomyStore()
  const toast = useToast()

  const tab = ref<'items' | 'other'>('items')
  const searchQuery = ref('')
  const searchInput = ref('')
  const statusFilter = ref<'all' | 'active' | 'deprecated'>('all')

  // Accordion collapse/expand states
  const expandedCategories = ref<Set<string>>(new Set())
  const expandedSubcategories = ref<Set<string>>(new Set())

  // Search debounce watch logic
  let searchDebounce: ReturnType<typeof setTimeout> | null = null
  watch(searchInput, (val) => {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      searchQuery.value = val
    }, 300)
  })

  // Search & filter computed categories tree
  const filteredCategories = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    const status = statusFilter.value

    return taxonomy.categories.map(cat => {
      const subcategories = cat.subcategories.map(sub => {
        const items = sub.items.filter(item => {
          const matchesQuery = !query || 
            item.code.toLowerCase().includes(query) || 
            item.label.toLowerCase().includes(query)
          const matchesStatus = status === 'all' || item.status === status
          return matchesQuery && matchesStatus
        })

        const subMatchesQuery = !query || 
          sub.code.toLowerCase().includes(query) || 
          sub.label.toLowerCase().includes(query)

        // Only include subcategory if it has matching items, or if we are not filtering/searching
        const shouldIncludeSub = (status === 'all' && !query) ? true : items.length > 0

        if (shouldIncludeSub) {
          if (query && items.length > 0) {
            expandedSubcategories.value.add(sub.code)
          }
          return { ...sub, items }
        }
        return null
      }).filter((sub): sub is Exclude<typeof sub, null> => sub !== null)

      const catMatchesQuery = !query || 
        cat.code.toLowerCase().includes(query) || 
        cat.label.toLowerCase().includes(query)

      // Only include category if it has matching subcategories, or if we are not filtering/searching
      const shouldIncludeCat = (status === 'all' && !query) ? true : subcategories.length > 0

      if (shouldIncludeCat) {
        if (query && subcategories.length > 0) {
          expandedCategories.value.add(cat.code)
        }
        return { ...cat, subcategories }
      }
      return null
    }).filter((cat): cat is Exclude<typeof cat, null> => cat !== null)
  })

  function isCategoryExpanded(code: string): boolean {
    return expandedCategories.value.has(code)
  }

  function isSubcategoryExpanded(code: string): boolean {
    return expandedSubcategories.value.has(code)
  }

  function toggleCategory(code: string) {
    if (expandedCategories.value.has(code)) {
      expandedCategories.value.delete(code)
    } else {
      expandedCategories.value = new Set([code])
    }
  }

  function toggleSubcategory(code: string) {
    if (expandedSubcategories.value.has(code)) {
      expandedSubcategories.value.delete(code)
    } else {
      expandedSubcategories.value = new Set([code])
    }
  }

  function expandAll() {
    taxonomy.categories.forEach(cat => {
      expandedCategories.value.add(cat.code)
      cat.subcategories.forEach(sub => {
        expandedSubcategories.value.add(sub.code)
      })
    })
  }

  function collapseAll() {
    expandedCategories.value.clear()
    expandedSubcategories.value.clear()
  }

  const showAdd = ref(false)
  const addForm = reactive({
    categoryCode: '',
    subcategoryCode: '',
    subcategoryLabel: '',
    label: '',
  })

  const renameForm = reactive({
    key: '',
    label: '',
  })

  function openAdd() {
    addForm.categoryCode = taxonomy.categories[0]?.code || ''
    addForm.subcategoryCode = ''
    addForm.subcategoryLabel = ''
    addForm.label = ''
    showAdd.value = true
  }
  async function submitAdd() {
    if (!addForm.categoryCode || !addForm.subcategoryCode || !addForm.label.trim()) {
      toast.error('Category, sub-category code, and label are all required.')
      return
    }

    // Validate that the sub-category code matches the selected category prefix (e.g. B1 for B1.x)
    const categoryPrefix = addForm.categoryCode.trim().toUpperCase()
    const enteredSubCode = addForm.subcategoryCode.trim().toUpperCase()
    if (!enteredSubCode.startsWith(categoryPrefix)) {
      toast.error(`Sub-category code must start with ${categoryPrefix} (e.g., ${categoryPrefix}.1)`)
      return
    }

    const cleanSubCode = enteredSubCode.toLowerCase()
    const cleanAddLabel = addForm.label.trim().toLowerCase()

    // Find if subcategory already exists
    let targetSubcategory: { code: string; label: string; items: any[] } | null = null
    for (const cat of taxonomy.categories) {
      for (const sub of cat.subcategories) {
        if (sub.code.trim().toLowerCase() === cleanSubCode) {
          targetSubcategory = sub
          break
        }
      }
      if (targetSubcategory) break
    }

    // If subcategory exists, check if exact item already exists under it
    if (targetSubcategory) {
      const duplicateItem = targetSubcategory.items.find(
        (item: any) => item.label.trim().toLowerCase() === cleanAddLabel
      )
      if (duplicateItem) {
        toast.error(`Item "${duplicateItem.label}" already exists under ${targetSubcategory.code}`)
        return
      }
    }

    try {
      await taxonomy.createStandardItem({
        categoryCode: addForm.categoryCode,
        subcategoryCode: enteredSubCode,
        subcategoryLabel: addForm.subcategoryLabel || (targetSubcategory ? targetSubcategory.label : enteredSubCode),
        label: addForm.label.trim(),
      })
      toast.success('Custom activity item created and saved to database!')

      // Auto-expand category and subcategory to highlight the new item
      expandedCategories.value.add(addForm.categoryCode)
      expandedSubcategories.value.add(enteredSubCode)

      showAdd.value = false
      tab.value = 'items'
    } catch (err: any) {
      console.error('Failed to create taxonomy item:', err)
      toast.error(err?.response?.data?.message || 'Failed to save activity item')
    }
  }

  const confirmTarget = ref<TaxonomyRow | any | null>(null)

  function rowKey(kind: string, id: number) {
    return `${kind}-${id}`
  }

  function beginRename(row: any, kindName?: string) {
    const kind = kindName || row.kind || (row.items ? 'subcategory' : 'category')
    renameForm.key = rowKey(kind, row.id)
    renameForm.label = row.label
  }

  function cancelRename() {
    renameForm.key = ''
    renameForm.label = ''
  }

  async function saveRename(row: any, kindName?: string) {
    const label = renameForm.label.trim()
    if (!label) return

    const kind = kindName || row.kind || (row.items ? 'subcategory' : 'category')
    try {
      await taxonomy.renameEntry(kind, row.id, label)
      toast.success('Taxonomy name updated')
      cancelRename()
    } catch (err: any) {
      console.error('Rename failed:', err)
      toast.error(err.response?.data?.message || err.message || 'Failed to rename')
    }
  }

  function askDeprecate(row: any, kind?: string) {
    confirmTarget.value = {
      ...row,
      kind: kind || row.kind || (row.items ? 'subcategory' : 'category')
    }
  }

  async function confirmDeprecate() {
    const row = confirmTarget.value
    if (!row) return

    await taxonomy.deprecateEntry(row.kind, row.id)
    toast.success('Taxonomy entry deprecated')
    confirmTarget.value = null
  }

  function askRestore(row: any, kind?: string) {
    confirmTarget.value = {
      ...row,
      kind: kind || row.kind || (row.items ? 'subcategory' : 'category')
    }
  }

  async function confirmRestore() {
    const row = confirmTarget.value
    if (!row) return

    await taxonomy.restoreEntry(row.kind, row.id)
    toast.success('Taxonomy entry restored')
    confirmTarget.value = null
  }

  const promoteTarget = ref<OtherQueueEntry | null>(null)
  const promoteForm = reactive({
    categoryCode: '',
    subcategoryCode: '',
    subcategoryLabel: '',
  })

  function openPromote(entry: OtherQueueEntry) {
    promoteTarget.value = entry
    const guessCat = entry.suggestedCategory.split('.')[0] || ''
    promoteForm.categoryCode = entry.categoryCode || guessCat
    promoteForm.subcategoryCode = entry.suggestedCategory
    promoteForm.subcategoryLabel = entry.subcategoryLabel || ''
  }

  async function confirmPromote() {
    if (!promoteTarget.value) return

    try {
      await taxonomy.promoteOtherEntry(promoteTarget.value.id, { ...promoteForm })
      toast.success('Promoted to standard taxonomy and saved to database!')

      // Auto-expand category and subcategory to show promoted item
      expandedCategories.value.add(promoteForm.categoryCode)
      expandedSubcategories.value.add(promoteForm.subcategoryCode)

      promoteTarget.value = null
      tab.value = 'items'
    } catch (err: any) {
      console.error('Failed to promote taxonomy entry:', err)
      toast.error(err?.response?.data?.message || 'Failed to promote entry')
    }
  }

  async function dismiss(entry: OtherQueueEntry) {
    await taxonomy.dismissOtherEntry(entry.id)
    toast.info('Entry dismissed')
  }

  return {
    taxonomy,
    tab,
    searchQuery,
    searchInput,
    statusFilter,
    expandedCategories,
    expandedSubcategories,
    filteredCategories,
    showAdd,
    addForm,
    renameForm,
    confirmTarget,
    promoteTarget,
    promoteForm,
    isCategoryExpanded,
    isSubcategoryExpanded,
    toggleCategory,
    toggleSubcategory,
    expandAll,
    collapseAll,
    openAdd,
    submitAdd,
    rowKey,
    beginRename,
    cancelRename,
    saveRename,
    askDeprecate,
    confirmDeprecate,
    askRestore,
    confirmRestore,
    openPromote,
    confirmPromote,
    dismiss,
  }
})
