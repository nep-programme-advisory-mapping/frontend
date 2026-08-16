import type { ActivityInclusion, InclusionGroup } from '@/types/taxonomy'
import { GROUPS_CONFIG } from '@/constants/taxonomy'

export function isGroupSelected(inclusions: Record<string, ActivityInclusion>, itemCode: string, groupName: InclusionGroup): boolean {
  const inc = inclusions[itemCode]
  if (!inc?.dimensions) return false
  return inc.dimensions.some(d => d.group === groupName)
}

export function getGroupType(inclusions: Record<string, ActivityInclusion>, itemCode: string, groupName: InclusionGroup): 'A' | 'B' {
  const inc = inclusions[itemCode]
  if (!inc?.dimensions) return 'B'
  const dim = inc.dimensions.find(d => d.group === groupName)
  return dim?.type || 'B'
}

export function getGroupOtherText(inclusions: Record<string, ActivityInclusion>, itemCode: string): string {
  const inc = inclusions[itemCode]
  if (!inc?.dimensions) return ''
  const dim = inc.dimensions.find(d => d.group === 'Other')
  return dim?.otherText || ''
}

export function toggleGroupSelection(inclusions: Record<string, ActivityInclusion>, itemCode: string, groupName: InclusionGroup): Record<string, ActivityInclusion> {
  const inc = inclusions[itemCode]
  if (!inc) return inclusions

  const dimensions = [...inc.dimensions]
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

  return {
    ...inclusions,
    [itemCode]: {
      ...inc,
      dimensions
    }
  }
}

export function setGroupType(inclusions: Record<string, ActivityInclusion>, itemCode: string, groupName: InclusionGroup, type: 'A' | 'B'): Record<string, ActivityInclusion> {
  const inc = inclusions[itemCode]
  if (!inc) return inclusions

  const dimensions = [...inc.dimensions]
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

  return {
    ...inclusions,
    [itemCode]: {
      ...inc,
      dimensions
    }
  }
}

export function setGroupOtherText(inclusions: Record<string, ActivityInclusion>, itemCode: string, otherText: string): Record<string, ActivityInclusion> {
  const inc = inclusions[itemCode]
  if (!inc) return inclusions

  const dimensions = [...inc.dimensions]
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

  return {
    ...inclusions,
    [itemCode]: {
      ...inc,
      dimensions
    }
  }
}

export function updateInclusionToggle(inclusions: Record<string, ActivityInclusion>, itemCode: string, hasInclusion: boolean): Record<string, ActivityInclusion> {
  const inc = inclusions[itemCode]
  if (!inc) return inclusions

  return {
    ...inclusions,
    [itemCode]: {
      hasInclusion,
      dimensions: hasInclusion ? (inc.dimensions || []) : []
    }
  }
}
