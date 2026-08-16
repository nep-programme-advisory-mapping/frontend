/**
 * Dedicated helper utilities for Section 2 Activity Taxonomy processing.
 * Fully encapsulated to prevent cross-module side effects.
 */

export interface RawActivity {
  id?: number
  is_primary?: boolean
  primary?: boolean
  code?: string
  activity_item_id?: number
  activity_item?: {
    id?: number
    code?: string
  }
}

/**
 * Extracts all selected activity codes from an activity collection.
 * Supports activity objects as well as raw string code arrays.
 * Returns all unique activity codes for badges display.
 *
 * @param activities - Array of raw activity records or string codes
 * @returns Array of unique activity codes
 */
export function extractPrimaryActivityCodes(activities: (RawActivity | string)[] | null | undefined): string[] {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return []
  }

  const primaryCodes: string[] = []
  const allCodes: string[] = []

  for (const item of activities) {
    if (typeof item === 'string') {
      if (item.trim()) {
        allCodes.push(item.trim())
      }
      continue
    }

    if (!item || typeof item !== 'object') continue

    const code = item.activity_item?.code || item.code || ''
    if (!code) continue

    allCodes.push(code)

    if (item.is_primary || item.primary) {
      primaryCodes.push(code)
    }
  }

  const result = allCodes.length > 0 ? allCodes : primaryCodes
  return Array.from(new Set(result))
}
