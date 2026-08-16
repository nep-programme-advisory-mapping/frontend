import api from './axios'

export const authApi = {
  getCsrfCookie() {
    // Sanctum CSRF cookie is served at the host root (not under /api)
    const baseURL = api.defaults.baseURL || ''
    const csrfURL = baseURL.replace(/\/api$/, '') + '/sanctum/csrf-cookie'
    return api.get(csrfURL, { baseURL: '' })
  },
  login(credentials: { email: string; password: string }) {
    return api.post('/login', credentials)
  },
  logout() {
    return api.post('/logout')
  },
  getUser() {
    return api.get('/user')
  },
  forgotPassword(payload: { email: string }) {
    return api.post('/forgot-password', payload)
  },
  resetPassword(payload: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }) {
    return api.post('/reset-password', payload)
  },
  changePassword(payload: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }) {
    return api.patch('/change-password', payload)
  },
}
