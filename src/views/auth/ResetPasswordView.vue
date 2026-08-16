<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseFormField from '@/components/common/BaseFormField.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import LoginVisual from '@/components/login/LoginVisual.vue'
import { authApi } from '@/api/auth.api'

const route = useRoute()
const router = useRouter()

const token = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

const passwordError = ref('')
const confirmError = ref('')
const generalError = ref('')
const loading = ref(false)
const success = ref(false)
const linkInvalid = ref(false)

let redirectTimer: ReturnType<typeof setTimeout>

onMounted(() => {
  token.value = (route.query.token as string) || ''
  email.value = (route.query.email as string) || ''
  if (!token.value || !email.value) linkInvalid.value = true
})

onUnmounted(() => clearTimeout(redirectTimer))

async function submit() {
  passwordError.value = ''
  confirmError.value = ''
  generalError.value = ''

  if (!password.value || password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== passwordConfirmation.value) {
    confirmError.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await authApi.resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    success.value = true
    redirectTimer = setTimeout(() => router.push('/login'), 2500)
  } catch (error: any) {
    if (error.response?.status === 422) {
      generalError.value =
        error.response.data?.message ||
        'This password reset link is invalid or has expired. Please request a new one.'
    } else {
      generalError.value = 'Unable to reach the server. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen bg-teal-900 justify-center lg:justify-normal">
    <LoginVisual />

    <div class="w-full md:w-[600px] lg:w-[650px] bg-white flex flex-col justify-center p-6 sm:p-10 lg:p-14 flex-shrink-0 min-h-screen md:min-h-fit lg:min-h-screen md:rounded-2xl lg:rounded-none md:shadow-2xl lg:shadow-none mx-auto lg:mx-0 md:my-auto lg:my-0">

      <!-- Mobile logo -->
      <div class="lg:hidden mb-8 flex flex-col items-start gap-4">
        <img src="@/assets/images/logoes/NEP-logoo.webp" alt="NEP Logo" class="w-16" />
        <div>
          <h1 class="text-xl font-bold text-gray-900 leading-tight">NEP Cambodia</h1>
          <p class="text-xs text-gray-500 mt-1">Programme Coordination Layer</p>
        </div>
      </div>

      <!-- Invalid link -->
      <template v-if="linkInvalid">
        <div class="text-center">
          <div class="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <BaseIcon name="alert" size="22" />
          </div>
          <h2 class="text-xl font-semibold mb-2">Invalid reset link</h2>
          <p class="text-sm text-gray-500 mb-6.5">
            This password reset link is missing required information. Please request a new one.
          </p>
          <router-link to="/forgot-password" class="text-teal-700 font-semibold hover:underline text-sm">
            Request a new reset link
          </router-link>
        </div>
      </template>

      <!-- Success -->
      <template v-else-if="success">
        <div class="text-center">
          <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
            <BaseIcon name="check" size="22" />
          </div>
          <h2 class="text-xl font-semibold mb-2">Password reset</h2>
          <p class="text-sm text-gray-500">
            Your password has been reset successfully. Redirecting you to sign in…
          </p>
        </div>
      </template>

      <!-- Form -->
      <template v-else>
        <h2 class="text-xl font-semibold mb-2">Set a new password</h2>
        <p class="text-sm text-gray-500 mb-6.5">
          Choose a new password for <strong class="text-gray-900">{{ email }}</strong>.
        </p>

        <form @submit.prevent="submit" class="space-y-4" novalidate>
          <BaseFormField label="New password" :error="passwordError">
            <div class="relative">
              <BaseInput
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full pr-10"
                :error="!!passwordError"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <BaseIcon name="eye" size="20" />
              </button>
            </div>
          </BaseFormField>

          <BaseFormField label="Confirm new password" :error="confirmError">
            <div class="relative">
              <BaseInput
                id="password_confirmation"
                :type="showConfirm ? 'text' : 'password'"
                v-model="passwordConfirmation"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full pr-10"
                :error="!!confirmError"
              />
              <button
                type="button"
                @click="showConfirm = !showConfirm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                :aria-label="showConfirm ? 'Hide password' : 'Show password'"
              >
                <BaseIcon name="eye" size="20" />
              </button>
            </div>
          </BaseFormField>

          <div
            v-if="generalError"
            class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <BaseIcon name="alert" size="16" class="mt-0.5 shrink-0 text-red-500" />
            <span>{{ generalError }}</span>
          </div>

          <BaseButton type="submit" class="w-full justify-center mt-2" :disabled="loading">
            {{ loading ? 'Resetting…' : 'Reset password' }}
          </BaseButton>

          <div class="text-sm text-center mt-2">
            <router-link to="/login" class="text-teal-700 font-semibold hover:underline">
              Back to sign in
            </router-link>
          </div>
        </form>
      </template>

    </div>
  </div>
</template>
