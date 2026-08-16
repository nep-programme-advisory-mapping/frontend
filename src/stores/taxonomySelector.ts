import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { mockTaxonomies, GROUPS_CONFIG } from '@/constants/taxonomy'
import type { SelectedActivity, ActivityInclusion, InclusionGroup } from '@/types/taxonomy'

export const useTaxonomySelectorStore = defineStore('taxonomySelector', () => {
  // State
  const selectedCategoryId = ref<number | null>(null)
  const selectedSubCategoryId = ref<number | null>(null)
  const selectedItemsData = ref<SelectedActivity[]>([])

  const errors = ref({
    activities: {} as Record<number, any>,
    general: '',
  })

  // Watch category changes to reset sub-category
  watch(selectedCategoryId, () => {
    selectedSubCategoryId.value = null
  })

  // Computed Data
  const availableSubCategories = computed(() => {
    const category = mockTaxonomies.find(c => c.id === selectedCategoryId.value)
    return category ? category.subCategories : []
  })

  const availableItems = computed(() => {
    const subCategory = availableSubCategories.value.find(s => s.id === selectedSubCategoryId.value)
    return subCategory ? subCategory.items.filter(item => item.is_active !== false) : []
  })

  const selectedItemIds = computed({
    get: () => selectedItemsData.value.map(item => item.id),
    set: (newIds: number[]) => {
      const addedIds = newIds.filter(id => !selectedItemIds.value.includes(id))
      const removedIds = selectedItemIds.value.filter(id => !newIds.includes(id))
      
      let updated = [...selectedItemsData.value]
      
      // Remove unselected
      updated = updated.filter(item => !removedIds.includes(item.id))
      
      // Add newly selected (looking up from currently available items)
      addedIds.forEach(id => {
        const itemToAdd = availableItems.value.find(i => i.id === id)
        if (itemToAdd) {
          updated.push({
            ...itemToAdd,
            educationLevelIds: [],
            inclusion: { hasInclusion: false, dimensions: [] }
          })
        }
      })
      
      selectedItemsData.value = updated
    }
  })

  const canSave = computed(() => {
    return selectedItemsData.value.length > 0 && selectedItemsData.value.every(item => item.educationLevelIds && item.educationLevelIds.length > 0)
  })

  // Helpers
  const isGroupSelected = (inclusion: ActivityInclusion | undefined, groupName: InclusionGroup): boolean => {
    if (!inclusion?.dimensions) return false
    return inclusion.dimensions.some(d => d.group === groupName)
  }

  const getGroupType = (inclusion: ActivityInclusion | undefined, groupName: InclusionGroup): 'A' | 'B' => {
    if (!inclusion?.dimensions) return 'B'
    const dim = inclusion.dimensions.find(d => d.group === groupName)
    return dim?.type || 'B'
  }

  const getGroupOtherText = (inclusion: ActivityInclusion | undefined): string => {
    if (!inclusion?.dimensions) return ''
    const dim = inclusion.dimensions.find(d => d.group === 'Other')
    return dim?.otherText || ''
  }

  // Modifiers
  const toggleGroupSelection = (itemId: number, currentInclusion: ActivityInclusion | undefined, groupName: InclusionGroup) => {
    const dimensions = [...(currentInclusion?.dimensions || [])]
    const idx = dimensions.findIndex(d => d.group === groupName)
    
    if (idx === -1) {
      const allowsA = GROUPS_CONFIG.find(g => g.name === groupName)?.allowsA ?? false
      dimensions.push({
        group: groupName,
        type: allowsA ? 'A' : 'B',
        otherText: groupName === 'Other' ? '' : undefined
      })
    } else {
      dimensions.splice(idx, 1)
    }
    
    handleUpdateInclusion(itemId, {
      hasInclusion: currentInclusion?.hasInclusion ?? true,
      dimensions
    })
  }

  const setGroupType = (itemId: number, currentInclusion: ActivityInclusion | undefined, groupName: InclusionGroup, type: 'A' | 'B') => {
    const dimensions = [...(currentInclusion?.dimensions || [])]
    const idx = dimensions.findIndex(d => d.group === groupName)
    
    if (idx !== -1) {
      const dim = dimensions[idx]
      if (dim) {
        dimensions[idx] = {
          ...dim,
          type
        }
      }
    }
    
    handleUpdateInclusion(itemId, {
      hasInclusion: currentInclusion?.hasInclusion ?? true,
      dimensions
    })
  }

  const setGroupOtherText = (itemId: number, currentInclusion: ActivityInclusion | undefined, otherText: string) => {
    const dimensions = [...(currentInclusion?.dimensions || [])]
    const idx = dimensions.findIndex(d => d.group === 'Other')
    
    if (idx !== -1) {
      const dim = dimensions[idx]
      if (dim) {
        dimensions[idx] = {
          ...dim,
          otherText
        }
      }
    }
    
    handleUpdateInclusion(itemId, {
      hasInclusion: currentInclusion?.hasInclusion ?? true,
      dimensions
    })
  }

  const updateInclusionToggle = (itemId: number, currentInclusion: ActivityInclusion | undefined, hasInclusion: boolean) => {
    handleUpdateInclusion(itemId, {
      hasInclusion,
      dimensions: hasInclusion ? (currentInclusion?.dimensions || []) : []
    })
  }

  const handleRemoveItem = (itemId: number) => {
    selectedItemsData.value = selectedItemsData.value.filter(item => item.id !== itemId)
  }

  const handleUpdateEducationLevels = (itemId: number, levels: number[]) => {
    const index = selectedItemsData.value.findIndex(i => i.id === itemId)
    if (index !== -1 && selectedItemsData.value[index]) {
      selectedItemsData.value[index]!.educationLevelIds = levels
      if (levels.length > 0 && errors.value.activities[index]?.educationLevels) {
        delete errors.value.activities[index].educationLevels
      }
    }
  }

  const handleUpdateInclusion = (itemId: number, inclusion: ActivityInclusion) => {
    const index = selectedItemsData.value.findIndex(i => i.id === itemId)
    if (index !== -1 && selectedItemsData.value[index]) {
      selectedItemsData.value[index]!.inclusion = inclusion
      if (errors.value.activities[index]) {
        if (!inclusion.hasInclusion || (inclusion.dimensions && inclusion.dimensions.length > 0)) {
          delete errors.value.activities[index].inclusionGroup
        }
        if (inclusion.dimensions?.every(d => d.type)) {
          delete errors.value.activities[index].inclusionType
        }
      }
    }
  }

  const handleUpdateIsPrimary = (itemId: number, isPrimary: boolean) => {
    const index = selectedItemsData.value.findIndex(i => i.id === itemId)
    if (index !== -1 && selectedItemsData.value[index]) {
      selectedItemsData.value[index]!.is_primary = isPrimary
    }
  }

  const validateForm = () => {
    errors.value.activities = {}
    errors.value.general = ''
    let isValid = true

    if (selectedItemsData.value.length === 0) {
      errors.value.general = 'At least one activity must be selected.'
      isValid = false
    }

    selectedItemsData.value.forEach((item, index) => {
      const itemErrors: any = {}

      if (!item.educationLevelIds || item.educationLevelIds.length === 0) {
        itemErrors.educationLevels = 'Please select at least one education level.'
        isValid = false
      }

      if (item.inclusion?.hasInclusion) {
        if (!item.inclusion.dimensions || item.inclusion.dimensions.length === 0) {
          itemErrors.inclusionGroup = 'Please select a group.'
          isValid = false
        } else {
          item.inclusion.dimensions.forEach(dim => {
            if (!dim.type) {
              itemErrors.inclusionType = 'Please select an inclusion type.'
              isValid = false
            }
          })
        }
      }

      if (Object.keys(itemErrors).length > 0) {
        errors.value.activities[index] = itemErrors
      }
    })

    return isValid
  }

  const mapServerErrors = (newErrors: Record<string, string[]>) => {
    Object.keys(newErrors).forEach(key => {
      const match = key.match(/^activities\.(\d+)\.(.+)$/)
      if (match) {
        const index = parseInt(match[1] as string, 10)
        const field = match[2] as string
        if (!errors.value.activities[index]) {
          errors.value.activities[index] = {}
        }
        if (field.includes('education_level_ids')) {
          errors.value.activities[index].educationLevels = newErrors[key]?.[0] || ''
        } else if (field.includes('group')) {
          errors.value.activities[index].inclusionGroup = newErrors[key]?.[0] || ''
        } else if (field.includes('type')) {
          errors.value.activities[index].inclusionType = newErrors[key]?.[0] || ''
        }
      } else if (key === 'activities') {
        errors.value.general = newErrors[key]?.[0] || ''
      }
    })
  }

  const getSavePayload = () => {
    return {
      activities: selectedItemsData.value.map(item => ({
        activity_id: item.id,
        education_level_ids: item.educationLevelIds,
        inclusion: item.inclusion
      }))
    }
  }

  return {
    selectedCategoryId,
    selectedSubCategoryId,
    selectedItemsData,
    errors,
    availableSubCategories,
    availableItems,
    selectedItemIds,
    canSave,
    isGroupSelected,
    getGroupType,
    getGroupOtherText,
    toggleGroupSelection,
    setGroupType,
    setGroupOtherText,
    updateInclusionToggle,
    handleRemoveItem,
    handleUpdateEducationLevels,
    handleUpdateInclusion,
    handleUpdateIsPrimary,
    validateForm,
    mapServerErrors,
    getSavePayload,
  }
})
