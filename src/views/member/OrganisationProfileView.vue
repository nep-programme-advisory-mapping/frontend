<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrganisationProfileStore } from '@/stores/organisationProfile'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ChangePasswordForm from '@/components/user/ChangePasswordForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const profile = useOrganisationProfileStore()

onMounted(() => profile.loadOrg())
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Organisation Profile" />
    </template>

    <div class="mb-6">
      <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-tight m-0">Organisation profile</h1>
      <p class="text-[13px] text-[var(--ink-400)] mt-1">Your organisational account details. Contact NEP directly to change your registered email or reset your password.</p>
    </div>

    <div v-if="profile.loading" class="bg-white rounded-xl border border-[var(--line-soft)] shadow-sm p-16 flex items-center justify-center">
      <LoadingSpinner message="Loading organisation profile..." />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm p-5 sm:p-6">
          <h3 class="text-[14px] font-semibold text-[var(--ink-900)] mb-4">Account details</h3>

          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Organisation name</label>
            <input type="text" :value="profile.orgName" disabled class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-gray-100 disabled:cursor-not-allowed" />
          </div>

          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Registered email</label>
            <input type="email" :value="profile.userEmail" disabled class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-gray-100 disabled:cursor-not-allowed" />
            <div class="text-[11.5px] text-[var(--ink-500)] mt-1.5">To change this, contact your NEP focal point — NEP holds master credentials for every member account.</div>
          </div>

          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Primary contact name</label>
            <input type="text" v-model="profile.contactName" placeholder="Who at your organisation manages this account?" class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)]" />
          </div>

          <div class="mb-4">
            <label class="block text-[12.5px] font-semibold text-[var(--ink-700)] mb-1.5">Member since</label>
            <input type="text" :value="profile.memberSince" disabled class="w-full border border-[var(--line)] rounded-[8px] px-3 py-2.5 text-[13.3px] text-[var(--ink-900)] bg-gray-100 disabled:cursor-not-allowed" />
          </div>

          <button
            class="inline-flex items-center justify-center gap-2 rounded-[12px] font-bold text-[12px] px-3 py-[7px] bg-[#0F5A4D] text-white shadow-xs hover:bg-[#0c483d] transition-all disabled:opacity-45 disabled:cursor-not-allowed"
            @click="profile.save"
            :disabled="profile.saving || profile.loading"
          >
            {{ profile.saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </div>

      <div>
        <div class="bg-[var(--teal-50)] border border-[var(--teal-100)] rounded-[var(--radius)] shadow-sm p-5 sm:p-6">
          <div class="flex gap-3 items-start">
            <BaseIcon name="shield" :size="20" class="text-[var(--teal-700)] shrink-0 mt-0.5" />
            <div>
              <b class="text-[13px] text-[var(--ink-900)]">Why this account is organisational</b>
              <p class="text-[12.3px] text-[var(--ink-600)] mt-1.5">Accounts belong to the organisation, not an individual staff member. If your programme contact leaves, nothing is lost — ask NEP to update the contact name and, if needed, reset the password.</p>
            </div>
          </div>
        </div>

        <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm p-5 sm:p-6 mt-4">
          <h3 class="text-[14px] font-semibold text-[var(--ink-900)] mb-4">At a glance</h3>
          <div class="flex justify-between py-2 border-b border-dashed border-[var(--line-soft)] text-[13px]">
            <span class="text-[var(--ink-500)]">Programme entries</span><b class="text-[var(--ink-900)]">{{ profile.submittedCount }}</b>
          </div>
          <div class="flex justify-between py-2 text-[13px]">
            <span class="text-[var(--ink-500)]">Map visibility to other members</span><b class="text-[var(--ink-900)]">Restricted</b>
          </div>
          <p class="text-[11.5px] text-[var(--ink-500)] mt-2.5">Visibility is set centrally by NEP and applies to all members equally — it's not a per-organisation setting.</p>
        </div>

        <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm p-5 sm:p-6 mt-4 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-[14px] font-semibold text-[var(--ink-900)] mb-1">Password</h3>
            <p class="text-[12.5px] text-[var(--ink-500)] m-0">Keep your account secure by using a strong personal password.</p>
          </div>
          <button class="shrink-0 inline-flex items-center justify-center gap-2 rounded-[12px] font-bold text-[12px] px-3 py-[7px] bg-[#0F5A4D] text-white shadow-xs hover:bg-[#0c483d] transition-all" @click="profile.showChangePassword = true">
            Set new password
          </button>
        </div>

        <ChangePasswordForm
          v-if="profile.showChangePassword"
          @close="profile.showChangePassword = false"
          @success="profile.showChangePassword = false"
        />
      </div>
    </div>
  </AppShell>
</template>
