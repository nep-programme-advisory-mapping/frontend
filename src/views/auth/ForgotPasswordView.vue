<script setup lang="ts">
import { ref } from 'vue'
import BaseFormField from '@/components/common/BaseFormField.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import LoginVisual from '@/components/login/LoginVisual.vue'
import { authApi } from '@/api/auth.api'

const email = ref('')
const emailError = ref('')
const loading = ref(false)
const submitted = ref(false)
const networkError = ref('')

async function submit() {
  emailError.value = ''
  networkError.value = ''

  if (!email.value.trim()) {
    emailError.value = 'Email is required.'
    return
  }

  loading.value = true
  try {
    await authApi.getCsrfCookie()
    await authApi.forgotPassword({ email: email.value.trim() })
    submitted.value = true
  } catch (error: any) {
    if (error.response?.status === 422 && error.response?.data?.errors?.email) {
      emailError.value = error.response.data.errors.email[0]
    } else {
      networkError.value = 'Unable to reach the server. Please try again.'
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

      <template v-if="!submitted">
        <h2 class="text-xl font-semibold mb-2">Reset your password</h2>
        <p class="text-sm text-gray-500 mb-6.5">
          Enter your organisation email and we'll send you a link to reset your password.
        </p>

        <form @submit.prevent="submit" class="space-y-4" novalidate>
          <BaseFormField label="Organisation email" :error="emailError">
            <BaseInput
              id="email"
              type="email"
              v-model="email"
              autocomplete="username"
              placeholder="programmes@riverkids.org"
              :error="!!emailError"
            />
          </BaseFormField>

          <div
            v-if="networkError"
            class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <BaseIcon name="alert" size="16" class="mt-0.5 shrink-0 text-red-500" />
            <span>{{ networkError }}</span>
          </div>

          <BaseButton type="submit" class="w-full justify-center mt-2" :disabled="loading">
            {{ loading ? 'Sending…' : 'Send reset link' }}
          </BaseButton>

          <div class="text-sm text-center mt-2">
            <router-link to="/login" class="text-teal-700 font-semibold hover:underline">
              Back to sign in
            </router-link>
          </div>
        </form>
      </template>

      <template v-else>
        <div class="text-center">
          <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
            <BaseIcon name="check" size="22" />
          </div>
          <h2 class="text-xl font-semibold mb-2">Check your email</h2>
          <p class="text-sm text-gray-500 mb-6.5">
            If an account exists for <strong class="text-gray-900">{{ email }}</strong>, a password reset
            link has been sent. The link expires in 60 minutes.
          </p>
          <router-link to="/login" class="text-teal-700 font-semibold hover:underline text-sm">
            Back to sign in
          </router-link>
        </div>
      </template>

    </div>
  </div>
</template>
