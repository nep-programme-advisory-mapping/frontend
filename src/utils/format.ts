export { formatRelativeTime } from './date'
export { EDUCATION_LEVELS, INCLUSION_GROUPS } from '@/constants/map'
export { BUDGET_BANDS } from '@/constants/programme'

export function formatBudget(band: string | null | undefined): string {
  return band || '—'
}

export function formatDate(date?: string): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

export const AGREEMENT_STATUS: Record<string, string> = {
  active: 'Active',
  expired: 'Expired',
  'under renewal': 'Renewal',
  'under negotiation': 'Negotiating',
}
