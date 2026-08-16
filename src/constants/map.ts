// Education-level id -> label used to live here as a hardcoded map, but row
// ids depend on seed order and differ per environment. Use
// `useEducationLevelsStore` (stores/educationLevels.ts) instead, which fetches
// the real ids from the backend.

/**
 * Maps inclusion group keys to their display labels.
 * Used by the "Inclusion group" filter dropdown in MapFilterBar.
 * Aligned 1:1 with target inclusion taxonomy in Programme Entry form.
 */
export const INCLUSION_GROUPS: Record<string, string> = {
  disability: 'Disability',
  gender: 'Gender',
  lgbtiq: 'LGBTIQ+',
  ethnicity: 'Ethnicity/language',
  displacement: 'Displacement',
  migrant: 'Migrant families',
  statelessness: 'Statelessness',
  other: 'Other',
}
