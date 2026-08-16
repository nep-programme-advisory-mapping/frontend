/**
 * Maps education level API IDs to their display labels.
 * Used by the "Education level" filter dropdown in MapFilterBar.
 */
export const EDUCATION_LEVELS: Record<string, string> = {
  '1': 'Primary',
  '2': 'Lower Secondary',
  '3': 'Upper Secondary',
  '4': 'Tertiary',
}

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
