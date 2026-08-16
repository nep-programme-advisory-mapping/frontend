<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Organisation, OrganisationForm } from '@/types/organisations'

const props = defineProps<{
  open: boolean
  editOrg?: Organisation | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: OrganisationForm]
}>()

const name = ref('')
const contactName = ref('')
const email = ref('')
const memberSince = ref<number>(new Date().getFullYear())
const clientErrors = ref<Partial<Record<'name' | 'contact_name' | 'email' | 'member_since', string>>>({})

// Logo upload state
const logoPreview = ref<string | null>(null)
const logoFile = ref<File | null>(null)
const logoError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const isEditMode = computed(() => !!props.editOrg)
const title = computed(() => (isEditMode.value ? 'Edit Organisation' : 'Create Organisation'))
const subtitle = computed(() =>
  isEditMode.value ? 'Update the organisation details below.' : 'Fill in the details to create a new organisation.',
)
const avatarSrc = computed(() => {
  if (logoPreview.value) return logoPreview.value
  return props.editOrg?.logo_url ?? null
})
const initials = computed(() =>
  (props.editOrg?.name ?? name.value)
    .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
)

watch(
  () => props.open,
  (opened) => {
    if (!opened) return
    clientErrors.value = {}
    logoPreview.value = null
    logoFile.value = null
    logoError.value = ''
    isDragging.value = false
    name.value = props.editOrg?.name ?? ''
    contactName.value = props.editOrg?.contact_name ?? ''
    email.value = props.editOrg?.email ?? ''
    memberSince.value = props.editOrg?.member_since ?? new Date().getFullYear()
  },
)

function handleFile(file: File) {
  if (!file.type.startsWith('image/')) {
    logoError.value = 'Please select an image file.'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    logoError.value = 'Image must be under 10 MB.'
    return
  }

  logoError.value = ''
  logoPreview.value = URL.createObjectURL(file)
  logoFile.value = file
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  handleFile(file)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function removeLogo() {
  logoPreview.value = null
  logoFile.value = null
  logoError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function validate(): boolean {
  clientErrors.value = {}
  if (!name.value.trim()) clientErrors.value.name = 'Organisation name is required.'
  if (!contactName.value.trim()) clientErrors.value.contact_name = 'Contact name is required.'
  if (!email.value.trim()) {
    clientErrors.value.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    clientErrors.value.email = 'Enter a valid email address.'
  }
  if (!memberSince.value || memberSince.value < 1900 || memberSince.value > new Date().getFullYear()) {
    clientErrors.value.member_since = 'Enter a valid year.'
  }
  return Object.keys(clientErrors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    contact_name: contactName.value.trim(),
    email: email.value.trim(),
    member_since: memberSince.value,
    logoFile: logoFile.value,
  })
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="form-modal">
      <!-- Header -->
      <div class="form-header">
        <div class="header-icon" :class="isEditMode ? 'edit' : 'create'">
          <BaseIcon :name="isEditMode ? 'edit' : 'plus'" :size="18" />
        </div>
        <div class="header-text">
          <h2>{{ title }}</h2>
          <p>{{ subtitle }}</p>
        </div>
        <button class="close-btn" type="button" aria-label="Close modal" @click="emit('close')">
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate class="form-body">
        <!-- Logo upload -->
        <div 
          class="logo-field"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <input 
            ref="fileInputRef" 
            type="file" 
            accept="image/*" 
            class="hidden" 
            @change="onFileChange" 
          />
          <div class="logo-upload-area" :class="{ 'is-dragging': isDragging, 'has-image': avatarSrc }">
            <div class="logo-avatar" @click="fileInputRef?.click()">
              <img v-if="avatarSrc" :src="avatarSrc" :alt="name" class="logo-img" />
              <span v-else class="logo-initials">{{ initials || '?' }}</span>
              <div class="logo-overlay">
                <BaseIcon name="upload" :size="20" />
              </div>
            </div>
            <button 
              v-if="avatarSrc" 
              type="button" 
              class="logo-remove-btn" 
              @click.stop="removeLogo"
              aria-label="Remove logo"
            >
              <BaseIcon name="x" :size="14" />
            </button>
          </div>
          <div class="logo-meta">
            <p class="logo-label">Organisation Logo <span class="label-optional">Optional</span></p>
            <p class="logo-hint">
              <span v-if="avatarSrc">Drag & drop to replace · or click to change</span>
              <span v-else>Drag & drop an image · or click to browse</span>
              <span class="hint-separator">·</span>
              <span>PNG, JPG up to 10 MB</span>
            </p>
            <p v-if="logoError" class="field-error"><BaseIcon name="alert" :size="11" />{{ logoError }}</p>
          </div>
        </div>

        <div class="form-field">
          <label for="org-name">Organisation Name</label>
          <input id="org-name" v-model="name" type="text" placeholder="e.g. Green Future Foundation" :class="{ 'has-error': clientErrors.name }" autocomplete="off" />
          <p v-if="clientErrors.name" class="field-error"><BaseIcon name="alert" :size="11" />{{ clientErrors.name }}</p>
        </div>

        <!-- Contact Name -->
        <div class="form-field">
          <label for="org-contact">Contact Name</label>
          <input id="org-contact" v-model="contactName" type="text" placeholder="e.g. Jane Smith" :class="{ 'has-error': clientErrors.contact_name }" autocomplete="name" />
          <p v-if="clientErrors.contact_name" class="field-error"><BaseIcon name="alert" :size="11" />{{ clientErrors.contact_name }}</p>
        </div>

        <!-- Email -->
        <div class="form-field">
          <label for="org-email">Email Address</label>
          <input id="org-email" v-model="email" type="email" placeholder="e.g. contact@org.com" :class="{ 'has-error': clientErrors.email }" autocomplete="email" />
          <p v-if="clientErrors.email" class="field-error"><BaseIcon name="alert" :size="11" />{{ clientErrors.email }}</p>
        </div>

        <!-- Member Since -->
        <div class="form-field">
          <label for="org-since">Member Since (Year)</label>
          <input id="org-since" v-model.number="memberSince" type="number" placeholder="e.g. 2020" :class="{ 'has-error': clientErrors.member_since }" />
          <p v-if="clientErrors.member_since" class="field-error"><BaseIcon name="alert" :size="11" />{{ clientErrors.member_since }}</p>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" :disabled="isSaving" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <svg v-if="isSaving" class="spin-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Organisation' }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

<style scoped>
.form-modal { width: 100%; max-width: 480px; }

.form-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
.header-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.header-icon.create { background: var(--teal-100); color: var(--teal-700); }
.header-icon.edit { background: #eef0fb; color: #4338ca; }
.header-text { flex: 1; min-width: 0; }
.header-text h2 { font-size: 16px; font-weight: 700; color: var(--ink-900); }
.header-text p { font-size: 12.5px; color: var(--ink-400); margin-top: 2px; }
.close-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--ink-500); cursor: pointer; transition: all 0.12s; flex-shrink: 0; }
.close-btn:hover { border-color: var(--ink-400); color: var(--ink-700); }

.form-body { display: flex; flex-direction: column; gap: 16px; }
.form-field label { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--ink-700); margin-bottom: 6px; }
.form-field input { width: 100%; border: 1px solid var(--line); border-radius: 9px; padding: 10px 13px; font-size: 13.5px; font-family: inherit; color: var(--ink-900); background: #fff; transition: all 0.15s ease; }
.form-field input:focus { outline: none; border-color: var(--teal-600); box-shadow: 0 0 0 3px var(--teal-100); }
.form-field input.has-error { border-color: var(--red-600); }
.form-field input::placeholder { color: var(--ink-300); }
.field-error { display: flex; align-items: center; gap: 5px; margin-top: 6px; font-size: 11.5px; color: var(--red-600); }

.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; padding-top: 18px; border-top: 1px solid var(--line-soft); }
.spin-icon { width: 14px; height: 14px; animation: spin 0.8s linear infinite; flex-shrink: 0; }
.opacity-25 { opacity: 0.25; }
.opacity-75 { opacity: 0.75; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Logo upload */
.logo-field { 
  display: flex; 
  align-items: flex-start; 
  gap: 14px; 
  padding: 16px; 
  background: var(--bg); 
  border: 2px dashed var(--line-soft); 
  border-radius: 12px; 
  transition: all 0.2s ease;
  cursor: default;
}
.logo-field.is-dragging {
  border-color: var(--teal-600);
  background: var(--teal-50);
  transform: scale(1.01);
}
.logo-upload-area { 
  position: relative; 
  flex-shrink: 0; 
}
.logo-avatar { 
  position: relative; 
  width: 64px; 
  height: 64px; 
  border-radius: 12px; 
  overflow: hidden; 
  cursor: pointer; 
  flex-shrink: 0; 
  box-shadow: 0 2px 8px rgba(10,61,57,0.15); 
  transition: all 0.2s ease;
  border: 2px solid transparent;
}
.logo-avatar:hover {
  transform: scale(1.05);
  border-color: var(--teal-600);
}
.logo-img { width: 100%; height: 100%; object-fit: cover; }
.logo-initials { 
  width: 100%; 
  height: 100%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: linear-gradient(135deg, var(--teal-700), var(--teal-900)); 
  color: #fff; 
  font-size: 18px; 
  font-weight: 700; 
  letter-spacing: 0.05em; 
}
.logo-overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(0,0,0,0.5); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #fff; 
  opacity: 0; 
  transition: opacity 0.2s ease;
}
.logo-avatar:hover .logo-overlay { opacity: 1; }
.logo-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--red-600);
  color: #fff;
  border: 2px solid var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  z-index: 1;
}
.logo-remove-btn:hover {
  background: var(--red-700);
  transform: scale(1.15);
}
.logo-meta { 
  display: flex; 
  flex-direction: column; 
  gap: 4px; 
  flex: 1; 
  min-width: 0;
}
.logo-label { 
  font-size: 13px; 
  font-weight: 600; 
  color: var(--ink-800); 
  display: flex; 
  align-items: center; 
  gap: 6px; 
}
.label-optional { 
  font-size: 10px; 
  font-weight: 700; 
  padding: 2px 7px; 
  border-radius: 4px; 
  background: #f3f4f6; 
  color: var(--ink-500); 
  text-transform: uppercase; 
  letter-spacing: 0.04em; 
}
.logo-hint { 
  font-size: 11.5px; 
  color: var(--ink-400); 
  line-height: 1.4;
}
.hint-separator {
  margin: 0 4px;
  opacity: 0.5;
}
</style>
