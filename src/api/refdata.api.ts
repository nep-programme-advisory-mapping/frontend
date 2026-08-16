import api from './axios'
import { unwrapData } from '@/utils/apiHelpers'

export interface EducationLevel {
  id: number
  level_name: string
}

export interface BudgetBand {
  id: number
  label: string
  min_amount: number | null
  max_amount: number | null
}

// Reference data (education levels, budget bands, ...) rarely changes but its
// row ids depend on seed order, which can differ per environment — never
// hardcode these ids in the frontend, always fetch them from here.
let educationLevelsRequest: Promise<EducationLevel[]> | null = null
let budgetBandsRequest: Promise<BudgetBand[]> | null = null

export const refdataApi = {
  async educationLevels(): Promise<EducationLevel[]> {
    if (!educationLevelsRequest) {
      educationLevelsRequest = api
        .get<EducationLevel[] | { data: EducationLevel[] }>('/refdata/education-levels')
        .then((response) => unwrapData<EducationLevel[]>(response.data))
        .catch((err) => {
          educationLevelsRequest = null
          throw err
        })
    }
    return educationLevelsRequest
  },

  async budgetBands(): Promise<BudgetBand[]> {
    if (!budgetBandsRequest) {
      budgetBandsRequest = api
        .get<BudgetBand[] | { data: BudgetBand[] }>('/refdata/budget-bands')
        .then((response) => unwrapData<BudgetBand[]>(response.data))
        .catch((err) => {
          budgetBandsRequest = null
          throw err
        })
    }
    return budgetBandsRequest
  },
}
