import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStateStore = defineStore('appState', () => {
  const isLoaded = ref(true)
  return { isLoaded }
})
