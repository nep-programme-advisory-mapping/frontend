export const BUDGET_BANDS = [
  'Under $50,000',
  '$50,000–$200,000',
  '$200,000–$500,000',
  '$500,000–$2,000,000',
  'Above $2,000,000'
] as const

export type BudgetBand = (typeof BUDGET_BANDS)[number]

