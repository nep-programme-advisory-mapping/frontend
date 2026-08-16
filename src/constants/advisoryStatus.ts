/**
 * Canonical status values for an adviser submission / advisory note.
 *
 * These must stay byte-for-byte in sync with `AdvisoryNoteStatus` in the
 * backend (backend-api/app/Support/AdvisoryNoteStatus.php) — the two used to
 * be independent hardcoded strings on each side, which is how BUG-06
 * happened (a dashboard query compared against a status nothing ever wrote).
 * Import this instead of retyping the literals.
 */
export const ADVISORY_NOTE_STATUS = {
  SUBMITTED_FOR_REVIEW: 'Submitted for review',
  ANALYSED: 'analysed',
  ADVICE_DELIVERED: 'advice_delivered',
} as const

export type AdvisoryNoteStatusValue = (typeof ADVISORY_NOTE_STATUS)[keyof typeof ADVISORY_NOTE_STATUS]
