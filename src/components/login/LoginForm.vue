<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseFormField from '@/components/common/BaseFormField.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const showPassword = ref(false)

const router = useRouter()
const authStore = useAuthStore()

watch(email, () => { emailError.value = '' })
watch(password, () => { passwordError.value = '' })

async function quickLogin(e: string, p: string) {
  email.value = e
  password.value = p
  await submit()
}

async function submit() {
  emailError.value = ''
  passwordError.value = ''
  authStore.clearErrors()

  let hasErrors = false

  if (!email.value.trim()) {
    emailError.value = 'Email is required.'
    hasErrors = true
  }

  if (!password.value) {
    passwordError.value = 'Password is required.'
    hasErrors = true
  }

  if (hasErrors) return

  // 2. Trigger Auth Store Login API Request
  const success = await authStore.login(email.value, password.value)

  if (success) {
    if (authStore.userRole === 'member_org') {
      await router.push({ name: 'dashboard' })
    } else {
      const staffRoutes = [
        { permission: 'dashboard.view', name: 'admin-dashboard' },
        { permission: 'programmes.view', name: 'admin-programmes' },
        { permission: 'advisory.view-all', name: 'adviser' },
        { permission: 'reports.view', name: 'map' },
        { permission: 'users.view', name: 'admin-users' },
        { permission: 'organisations.view', name: 'admin-organization' },
        { permission: 'roles.view', name: 'admin-roles' },
        { permission: 'permissions.view', name: 'admin-permissions' },
        { permission: 'taxonomy.view', name: 'admin-taxonomy' },
        { permission: 'policy.view', name: 'policy' },
      ]
      const first = authStore.isSuperAdmin
        ? staffRoutes[0]
        : staffRoutes.find((r) => authStore.hasPermission(r.permission))
      await router.push({ name: first?.name ?? 'map' })
    }
  } else {
    // Clear password input immediately for security
    password.value = ''

    // Map backend field-level errors to UI fields
    if (authStore.fieldErrors.email?.[0]) {
      emailError.value = authStore.fieldErrors.email[0]
    }
    if (authStore.fieldErrors.password?.[0]) {
      passwordError.value = authStore.fieldErrors.password[0]
    }
  }
}
</script>

<template>
  <div class="w-full md:w-[600px] lg:w-[650px] bg-white flex flex-col justify-center p-6 sm:p-10 lg:p-14 flex-shrink-0 min-h-screen md:min-h-fit lg:min-h-screen md:rounded-2xl lg:rounded-none md:shadow-2xl lg:shadow-none mx-auto lg:mx-0 md:my-auto lg:my-0">
    <!-- Show logo only on small screens since left panel is hidden -->
    <div class="lg:hidden mb-8 flex flex-col items-start gap-4">
      <img src="@/assets/images/logoes/NEP-logoo.webp" alt="NEP Logo" class="w-16" />
      <div>
        <h1 class="text-xl font-bold text-gray-900 leading-tight">NEP Cambodia</h1>
        <p class="text-xs text-gray-500 mt-1">Programme Coordination Layer</p>
      </div>
    </div>

    <h2 class="text-xl font-semibold mb-2">Organisation sign in</h2>
    <p class="text-sm text-gray-500 mb-6.5">
      Accounts are organisational, not individual — staff turnover never costs you access.
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

      <BaseFormField label="Password" :error="passwordError">
        <div class="relative">
          <BaseInput
            id="password"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            autocomplete="current-password"
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

      <div class="text-sm text-right">
        <router-link to="/forgot-password" class="text-teal-700 font-semibold hover:underline"
          >Forgot your password?</router-link
        >
      </div>

      <BaseButton
        id="login-submit"
        type="submit"
        class="w-full justify-center mt-2"
        :disabled="authStore.loading"
      >
        {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
      </BaseButton>

       <!-- Network / Server Error Banner -->
    <div
      v-if="authStore.networkError"
      class="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <BaseIcon name="alert" size="16" class="mt-0.5 shrink-0 text-red-500" />
      <span>{{ authStore.networkError }}</span>
    </div>

    <!-- General Auth Error Banner (invalid credentials, server errors) -->
    <div
      v-else-if="authStore.authError && !authStore.fieldErrors.email && !authStore.fieldErrors.password"
      class="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <BaseIcon name="alert" size="16" class="mt-0.5 shrink-0 text-red-500" />
      <span>{{ authStore.authError }}</span>
    </div>
    </form>
  </div>
</template>
