import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/constants/apiBaseUrl'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Let browser set Content-Type automatically for FormData (includes boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    console.log('[axios] FormData detected, Content-Type deleted')
    console.log('[axios] headers:', JSON.stringify(config.headers))
    console.log('[axios] FormData entries:')
    for (const [k, v] of (config.data as FormData).entries()) {
      console.log(' ', k, v)
    }
  }

  // Attach XSRF token from cookie if present (Laravel CSRF)
  const xsrf = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
  if (xsrf) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf)

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      const isAuthRequest = requestUrl.endsWith('/login') || requestUrl.endsWith('/logout')

      if (!isAuthRequest) {
        const authStore = useAuthStore()
        authStore.clearAuthState(true)
      }
    }

    return Promise.reject(error)
  },
)

export default api

// Global deduplication for concurrent GET requests
const originalGet = api.get
const pendingGetRequests = new Map<string, Promise<any>>()

api.get = function (url: string, config?: any) {
  // Generate a unique key based on URL and query parameters
  const key = url + (config?.params ? '?' + JSON.stringify(config.params) : '')

  if (pendingGetRequests.has(key)) {
    return pendingGetRequests.get(key) as Promise<any>
  }

  const promise = originalGet.call(this, url, config).finally(() => {
    pendingGetRequests.delete(key)
  })

  pendingGetRequests.set(key, promise)
  return promise
}
