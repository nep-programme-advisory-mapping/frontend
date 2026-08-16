import { ref, onMounted } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'

export const useOrganisationProfileStore = defineStore('organisationProfile', () => {
  const orgName = ref('')
  const userEmail = ref('')
  const contactName = ref('')
  const memberSince = ref('')
  const submittedCount = ref(0)
  const saving = ref(false)
  const loading = ref(true)
  const showChangePassword = ref(false)

  const toast = useToast()

  async function loadOrg() {
    loading.value = true
    try {
      const auth = useAuthStore()
      if (!auth.currentUser) {
        await auth.fetchCurrentUser().catch(() => {})
      }
      const [orgRes, entriesRes] = await Promise.all([
        memberApi.getMyOrganisation(),
        memberApi.getSubmittedProgrammeEntries(1).catch(() => ({ data: { total: 0 } })),
      ])
      const org = orgRes.data.data || orgRes.data
      orgName.value = org.name || ''
      userEmail.value = org.email || ''
      contactName.value = org.contact_name || ''
      memberSince.value = org.member_since ? String(org.member_since) : 'This year'
      submittedCount.value = entriesRes.data?.total ?? entriesRes.data?.data?.length ?? 0
    } catch (err) {
      console.error('[loadOrg] Failed to load organisation profile:', err)
      toast.error('Failed to load organisation details.')
    } finally {
      loading.value = false
    }
  }

  async function save() {
    saving.value = true
    try {
      await memberApi.updateMyOrganisation({ contact_name: contactName.value })
      toast.success('Contact details updated')
    } catch {
      toast.error('Failed to update contact details.')
    } finally {
      saving.value = false
    }
  }

  return {
    orgName, userEmail, contactName, memberSince, submittedCount,
    saving, loading, showChangePassword,
    loadOrg, save,
  }
})
