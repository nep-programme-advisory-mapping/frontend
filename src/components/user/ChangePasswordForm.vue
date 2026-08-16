<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useToast } from '@/utils/toast'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()
const emit = defineEmits<{ close: []; success: [] }>()

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errors = reactive({ currentPassword: '', newPassword: '', confirmPassword: '', general: '' })
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

function clearFieldError(field: 'currentPassword' | 'newPassword' | 'confirmPassword') {
  errors[field] = ''
}

// Password requirement hint
const requirementHint = computed(() => {
  if (!form.newPassword) return ''
  const missing: string[] = []
  if (form.newPassword.length < 8) missing.push('8+ characters')
  if (!/[A-Z]/.test(form.newPassword)) missing.push('uppercase')
  if (!/[a-z]/.test(form.newPassword)) missing.push('lowercase')
  if (!/[0-9]/.test(form.newPassword)) missing.push('number')
  if (!/[^A-Za-z0-9]/.test(form.newPassword)) missing.push('special character')
  if (missing.length === 0) return ''
  return 'Must include: ' + missing.join(', ')
})



function validate() {
  clearErrors()

  if (!form.currentPassword.trim()) {
    errors.currentPassword = 'Current password is required'
    return false
  }
  if (!form.newPassword.trim()) {
    errors.newPassword = 'New password is required'
    return false
  } else if (form.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters'
    return false
  }
  if (!form.confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your new password'
    return false
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    return false
  }
  if (form.currentPassword === form.newPassword) {
    errors.newPassword = 'New password must be different from current password'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return

  const result = await auth.changePassword({
    current_password: form.currentPassword,
    new_password: form.newPassword,
    new_password_confirmation: form.confirmPassword,
  })

  if (result.success) {
    toast.success('Password updated successfully')
    resetForm()
    emit('success')
    emit('close')
  } else {
    const errorMessage = result.error || 'Failed to update password. Please try again.'
    errors.general = errorMessage
    toast.error(errorMessage)
    if (auth.fieldErrors.current_password?.[0]) errors.currentPassword = auth.fieldErrors.current_password[0]
    if (auth.fieldErrors.new_password?.[0]) errors.newPassword = auth.fieldErrors.new_password[0]
    if (auth.fieldErrors.new_password_confirmation?.[0]) errors.confirmPassword = auth.fieldErrors.new_password_confirmation[0]
  }
}

function clearErrors() {
  errors.currentPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  errors.general = ''
}

function resetForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  clearErrors()
}

function close() {
  resetForm()
  emit('close')
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-panel">
      <div class="modal-header">
        <h3>Set new password</h3>
        <button type="button" class="modal-close" @click="close" aria-label="Close">✕</button>
      </div>
      <p class="modal-subtitle">Update your password to keep your account secure</p>

      <form @submit.prevent="submit" class="form-stack">
        <div v-if="errors.general" class="alert alert-error">{{ errors.general }}</div>

        <!-- Current Password -->
        <div class="field">
          <label for="current-password">Current password <span class="text-red-500">*</span></label>
          <div class="pw-input-wrap">
            <input
              :type="showCurrent ? 'text' : 'password'"
              id="current-password"
              v-model="form.currentPassword"
              @input="clearFieldError('currentPassword')"
              :class="{ 'has-error': errors.currentPassword }"
              placeholder="Enter your current password"
              autocomplete="current-password"
            />
            <button type="button" class="pw-eye-btn" @click="showCurrent = !showCurrent" :aria-label="showCurrent ? 'Hide password' : 'Show password'">
              <svg v-if="showCurrent" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <span v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</span>
        </div>

        <!-- New Password -->
        <div class="field">
          <label for="new-password">New password <span class="text-red-500">*</span></label>
          <div class="pw-input-wrap">
            <input
              :type="showNew ? 'text' : 'password'"
              id="new-password"
              v-model="form.newPassword"
              @input="clearFieldError('newPassword')"
              :class="{ 'has-error': errors.newPassword }"
              placeholder="Enter new password (min. 8 characters)"
              autocomplete="new-password"
            />
            <button type="button" class="pw-eye-btn" @click="showNew = !showNew" :aria-label="showNew ? 'Hide password' : 'Show password'">
              <svg v-if="showNew" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <span v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</span>

          <!-- Single-line requirement hint -->
          <p v-if="requirementHint" class="pw-req pw-req--fail">{{ requirementHint }}</p>
          <p v-else-if="form.newPassword" class="pw-req pw-req--ok">Password looks good</p>
        </div>

        <!-- Confirm Password -->
        <div class="field">
          <label for="confirm-password">Confirm new password <span class="text-red-500">*</span></label>
          <div class="pw-input-wrap">
            <input
              :type="showConfirm ? 'text' : 'password'"
              id="confirm-password"
              v-model="form.confirmPassword"
              @input="clearFieldError('confirmPassword')"
              :class="{ 'has-error': errors.confirmPassword }"
              placeholder="Re-enter your new password"
              autocomplete="new-password"
            />
            <button type="button" class="pw-eye-btn" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Hide password' : 'Show password'">
              <svg v-if="showConfirm" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="auth.loading">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="auth.loading">
            <span v-if="auth.loading" class="spinner-sm"></span>
            {{ auth.loading ? 'Updating…' : 'Update password' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.pw-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.pw-input-wrap input {
  width: 100%;
  padding-right: 42px;
}
.pw-eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  padding: 4px;
  color: var(--ink-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.15s;
  line-height: 1;
}
.pw-eye-btn:hover {
  color: var(--ink-700);
}

.pw-strength-wrap {
  margin-top: 8px;
}

/* Requirements */
.pw-req {
  font-size: 11.5px;
  font-weight: 500;
  margin: 0;
  transition: color 0.2s;
}
.pw-req--ok {
  color: var(--green-700);
}
.pw-req--fail {
  color: var(--ink-400);
}

/* Field error */
.field-error {
  display: block;
  font-size: 11.5px;
  color: var(--red-600);
  margin-top: 5px;
}
</style>
