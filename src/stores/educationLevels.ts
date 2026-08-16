import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { refdataApi, type EducationLevel } from '@/api/refdata.api'

// Single source of truth for education-level id -> label. Row ids depend on
// seed order and differ per environment, so they're always fetched from the
// backend rather than hardcoded — see the education_levels autosave bug this
// replaced.
export const useEducationLevelsStore = defineStore('educationLevels', () => {
  const levels = ref<EducationLevel[]>([])
  const loaded = ref(false)
  let loadPromise: Promise<void> | null = null

  const labelById = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const l of levels.value) map[String(l.id)] = l.level_name
    return map
  })

  async function ensureLoaded() {
    if (loaded.value) return
    if (!loadPromise) {
      loadPromise = refdataApi.educationLevels()
        .then((data) => {
          levels.value = data
          loaded.value = true
        })
        .catch(() => {
          loadPromise = null
        })
    }
    return loadPromise
  }

  return { levels, labelById, ensureLoaded }
})
