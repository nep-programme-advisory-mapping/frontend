<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from '@/utils/toast'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()
const emit = defineEmits<{ close: []; success: [] }>()

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errors = reactive({ currentPassword: '', newPassword: '', confirmPassword: '', general: '' })
const showPasswords = ref(false)

function clearFieldError(field: 'currentPassword' | 'newPassword' | 'confirmPassword') {
  errors[field] = ''
}

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

        <div class="field">
          <label for="current-password">Current password</label>
          <input
            :type="showPasswords ? 'text' : 'password'"
            id="current-password"
            v-model="form.currentPassword"
            @input="clearFieldError('currentPassword')"
            :class="{ 'has-error': errors.currentPassword }"
            placeholder="Enter your current password"
            autocomplete="current-password"
          />
          <span v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</span>
        </div>

        <div class="field">
          <label for="new-password">New password</label>
          <input
            :type="showPasswords ? 'text' : 'password'"
            id="new-password"
            v-model="form.newPassword"
            @input="clearFieldError('newPassword')"
            :class="{ 'has-error': errors.newPassword }"
            placeholder="Enter new password (min. 8 characters)"
            autocomplete="new-password"
          />
          <span v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</span>
        </div>

        <div class="field">
          <label for="confirm-password">Confirm new password</label>
          <input
            :type="showPasswords ? 'text' : 'password'"
            id="confirm-password"
            v-model="form.confirmPassword"
            @input="clearFieldError('confirmPassword')"
            :class="{ 'has-error': errors.confirmPassword }"
            placeholder="Re-enter your new password"
            autocomplete="new-password"
          />
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>

        <label class="checkbox-label">
          <input type="checkbox" v-model="showPasswords" />
          <span>Show passwords</span>
        </label>

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
