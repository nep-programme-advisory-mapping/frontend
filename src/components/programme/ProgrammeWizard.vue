<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProgrammeIdentityForm from './ProgrammeIdentityForm.vue'
import ActivitiesForm from './ActivitiesForm.vue'
import AgreementsForm from './AgreementsForm.vue'
import ProgrammeKeywordsView from './ProgrammeKeywordsView.vue'
import ProgrammeGeographic from './ProgrammeGeographic.vue'
import ProgrammeFormHeader from './ProgrammeFormHeader.vue'
import ProgrammeStepperMobile from './ProgrammeStepperMobile.vue'
import ProgrammeStepperDesktop from './ProgrammeStepperDesktop.vue'
import ProgrammeNavigationGuide from './ProgrammeNavigationGuide.vue'
import ProgrammeFormFooter from './ProgrammeFormFooter.vue'
import { useProgrammeFormStore } from '@/stores/programmeForm'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const store = useProgrammeFormStore()
const auth = useAuthStore()

let mountedId: string | null = null
let _skipNextIdWatch = false
let _isMounted = false

onUnmounted(() => {
  _isMounted = false
  store.stopAutosaveWatch()
})

onMounted(async () => {
  _isMounted = true
  const isStaff = ['nep_admin', 'nep_coordinator'].includes(auth.userRole || '')
  const hasOrgId = !!route.query.org_id
  const hasEntryId = !!route.query.id

  if (isStaff && !hasOrgId && !hasEntryId) {
    router.replace('/admin/programmes')
    return
  }

  mountedId = route.query.id ? String(route.query.id) : null
  _skipNextIdWatch = true
  store.initializeForm(mountedId)
})

watch(
  () => route.query.id,
  async (newId) => {
    if (!_isMounted) return
    if (_skipNextIdWatch) {
      _skipNextIdWatch = false
      mountedId = newId ? String(newId) : null
      return
    }
    const entryId = newId ? String(newId) : null
    if (entryId === mountedId) return
    // If we had no id before (new entry) and now have one (just saved),
    // don't re-init — the store already has the data and org_id cached.
    if (!mountedId && entryId) {
      mountedId = entryId
      return
    }
    mountedId = entryId
    await store.initializeForm(entryId)
  }
)
</script>

<template>
  <!-- Page Header -->
  <ProgrammeFormHeader @save-and-exit="store.saveAndExit" />



  <!-- Two-column layout: Step Sidebar + Form -->
  <div class="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start w-full">
    <!-- Mobile Horizontal Stepper -->
    <ProgrammeStepperMobile @go-to-step="store.goToStep" />

    <!-- Desktop Step Sidebar -->
    <div class="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24 select-none">
      <ProgrammeStepperDesktop @go-to-step="store.goToStep" />
      <ProgrammeNavigationGuide />
    </div>

    <!-- Form Content Container -->
    <div class="flex-1 min-w-0 w-full relative">
      <div v-if="store.isInitializing" class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl min-h-[400px]">
        <div class="flex flex-col items-center justify-center text-teal-700">
          <svg class="animate-spin h-8 w-8 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span class="text-sm font-medium">Loading entry...</span>
        </div>
      </div>

      <!-- Step 1: Programme Identity -->
      <ProgrammeIdentityForm v-if="store.currentStep === 1" :ref="el => { store.identityFormRef = el }" v-model="store.section1Data"
        v-model:valid="store.section1Valid" :errors="store.errors" :disabled="store.isSaving" @clear-error="store.clearError" />

      <!-- Step 2: Activities -->
      <ActivitiesForm v-else-if="store.currentStep === 2" :ref="el => { store.activitiesFormRef = el }" :model-value="store.section2Data" />

      <!-- Step 3: Geographic Coverage -->
      <ProgrammeGeographic
        v-else-if="store.currentStep === 3"
        :ref="el => { store.geographicFormRef = el }"
      />

      <!-- Step 4: Government Agreements -->
      <AgreementsForm v-else-if="store.currentStep === 4" :ref="el => { store.agreementsFormRef = el }" v-model="store.section4Data" />

      <!-- Step 5: Keywords Form -->
      <div v-else-if="store.currentStep === 5">
        <ProgrammeKeywordsView v-model="store.keywordsData" />
        <div v-if="store.keywordsError"
          class="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <svg class="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ store.keywordsError }}</span>
        </div>
      </div>

      <!-- Bottom Navigation -->
      <ProgrammeFormFooter @go-back="store.goBack" @continue="store.continueToNext" />
    </div>
  </div>
</template>
