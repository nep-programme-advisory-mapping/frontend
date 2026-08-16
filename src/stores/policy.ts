import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { policyApi } from '@/api/policy.api'
import { useToast } from '@/utils/toast'
import { unwrapData } from '@/utils/apiHelpers'
import type { PolicyDocument, PolicyFormPayload } from '@/types/policy'

export const usePolicyStore = defineStore('policy', () => {
  const items = ref<PolicyDocument[]>([])
  const loading = ref(false)
  const error = ref('')
  const showForm = ref(false)
  const submitting = ref(false)
  const editingPolicy = ref<PolicyDocument | null>(null)
  const viewingPolicy = ref<PolicyDocument | null>(null)
  const deletingPolicy = ref<PolicyDocument | null>(null)
  const showDeleteConfirm = ref(false)
  const deleting = ref(false)

  const toast = useToast()

  async function fetchPolicies() {
    loading.value = true
    error.value = ''
    try {
      const res = await policyApi.getPolicies()
      const rawData = unwrapData(res.data)
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : [])
      items.value = list
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? 'Failed to load policy documents.'
    } finally {
      loading.value = false
    }
  }

  function promptDelete(doc: PolicyDocument) {
    deletingPolicy.value = doc
    showDeleteConfirm.value = true
  }

  function closeDeleteModal() {
    showDeleteConfirm.value = false
    deletingPolicy.value = null
  }

  async function confirmDelete() {
    if (!deletingPolicy.value) return
    deleting.value = true
    try {
      await policyApi.deletePolicy(deletingPolicy.value.id)
      toast.success('Policy document deleted')
      closeDeleteModal()
      await fetchPolicies()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete policy document')
    } finally {
      deleting.value = false
    }
  }

  async function handleSavePolicy(payload: PolicyFormPayload) {
    submitting.value = true
    try {
      if (editingPolicy.value) {
        await policyApi.updatePolicy(editingPolicy.value.id, payload)
        toast.success('Policy document updated successfully')
      } else {
        await policyApi.createPolicy(payload)
        toast.success('Policy document created successfully')
      }
      showForm.value = false
      await fetchPolicies()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save policy document')
    } finally {
      submitting.value = false
    }
  }

  function handleView(doc: PolicyDocument) {
    viewingPolicy.value = doc
  }

  function openAddModal() {
    editingPolicy.value = null
    showForm.value = true
  }

  function handleEdit(doc: PolicyDocument) {
    editingPolicy.value = doc
    showForm.value = true
  }

  return {
    items, loading, error, showForm, submitting, editingPolicy, viewingPolicy,
    deletingPolicy, showDeleteConfirm, deleting,
    fetchPolicies, promptDelete, closeDeleteModal, confirmDelete, handleSavePolicy, handleView,
    openAddModal, handleEdit,
  }
})
