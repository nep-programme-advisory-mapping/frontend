<script setup lang="ts">
import { computed, watch } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { PolicyDocument } from '@/types/policy'
import { usePolicyDocumentLoader } from '@/composables/usePolicyDocumentLoader'

const props = defineProps<{
  show: boolean
  document: PolicyDocument | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const hasFile = computed(() => Boolean(props.document?.has_file || props.document?.file_name || props.document?.file_url))
const fileName = computed(() => props.document?.file_name || props.document?.file_url?.split('/').pop() || props.document?.title || 'Document')

const isPdf = computed(() =>
  fileName.value.toLowerCase().endsWith('.pdf') || (props.document?.mime_type?.includes('pdf') ?? false)
)
const isWord = computed(() =>
  fileName.value.toLowerCase().endsWith('.doc') ||
  fileName.value.toLowerCase().endsWith('.docx') ||
  (props.document?.mime_type?.includes('word') ?? false) ||
  (props.document?.mime_type?.includes('document') ?? false)
)

const {
  fileObjectUrl, fileLoading, fileError, fileErrorMsg,
  docxHtml, docxError, docxLoading, docxErrorMsg,
  loadFile, loadDocx, cleanup, downloadDocument,
} = usePolicyDocumentLoader()

watch(() => props.show, async (val) => {
  if (val && props.document?.id && hasFile.value) {
    const blob = await loadFile(props.document.id)
    if (blob && isWord.value) {
      await loadDocx(blob)
    }
  } else if (!val) {
    cleanup()
  }
})

async function handleDownload() {
  if (!props.document?.id) return
  await downloadDocument(props.document.id, fileName.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 bg-black/45 flex items-center justify-center z-150 p-5 backdrop-blur-[2px]" @click="emit('close')">
        <div
          class="bg-white rounded-[14px] shadow-lg w-full max-w-[900px] overflow-hidden flex flex-col max-h-[95vh] h-[95vh] !p-0"
          @click.stop
        >
          <div class="px-5 py-4 border-b border-[var(--line-soft)] flex items-center justify-between bg-[var(--bg)] shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[var(--line)]">
                <BaseIcon name="file" size="20" class="text-[var(--teal-700)]" />
              </div>
              <div>
                <h2 class="text-[15px] font-bold text-[var(--ink-900)]">{{ document?.title || 'Document Preview' }}</h2>
                <p class="text-[12px] text-[var(--ink-500)] mt-0.5">
                  {{ hasFile ? fileName : 'No file attached' }}
                  <span v-if="document?.version"> • v{{ document.version }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="hasFile"
                @click="handleDownload"
                class="p-2 text-[var(--ink-400)] hover:text-[var(--ink-900)] rounded-lg transition-colors hover:bg-[var(--bg)]"
                title="Download"
              >
                <BaseIcon name="download" size="18" />
              </button>
              <button
                @click="emit('close')"
                class="p-2 text-[var(--ink-400)] hover:text-[var(--ink-900)] rounded-lg transition-colors hover:bg-[var(--bg)]"
              >
                <BaseIcon name="x" size="20" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-hidden bg-[var(--line-soft)]/60 flex flex-col">
            <div v-if="fileLoading" class="flex flex-col items-center justify-center h-full gap-3 text-[var(--ink-400)] bg-white">
              <svg class="animate-spin w-8 h-8 text-[var(--teal-600)]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p class="text-[13px]">Downloading document…</p>
            </div>

            <div v-else-if="fileError" class="flex flex-col items-center justify-center h-full gap-3 text-center p-6 bg-white">
              <BaseIcon name="alert" size="32" class="text-[var(--red-600)]" />
              <p class="text-[14px] font-semibold text-[var(--ink-700)]">Could not load document</p>
              <p class="text-[12px] text-[var(--ink-400)] max-w-sm break-all">
                {{ fileErrorMsg || 'Unknown error' }}
              </p>
              <button
                @click="handleDownload"
                class="mt-2 px-4 py-2 bg-[var(--teal-700)] text-white rounded-lg text-[13px] font-semibold hover:bg-[var(--teal-800)] transition"
              >Download file</button>
            </div>

            <embed
              v-else-if="isPdf && fileObjectUrl"
              :src="fileObjectUrl"
              type="application/pdf"
              class="w-full h-full border-none"
            />

            <div v-else-if="isWord" class="flex-1 overflow-y-auto bg-white p-8 md:p-12">
              <div v-if="docxLoading" class="flex flex-col items-center justify-center h-full gap-3 text-[var(--ink-400)]">
                <svg class="animate-spin w-8 h-8 text-[var(--teal-600)]" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p class="text-[13px]">Rendering document…</p>
              </div>

              <div v-else-if="docxError" class="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
                <BaseIcon name="alert" size="32" class="text-[var(--red-600)]" />
                <p class="text-[14px] font-semibold text-[var(--ink-700)]">Could not render document</p>
                <p class="text-[12px] text-[var(--ink-400)] max-w-sm break-all">
                  <span class="font-medium text-[var(--ink-500)]">Error:</span> {{ docxErrorMsg || 'Unknown error' }}
                </p>
                <button
                  @click="handleDownload"
                  class="mt-2 px-4 py-2 bg-[var(--teal-700)] text-white rounded-lg text-[13px] font-semibold hover:bg-[var(--teal-800)] transition"
                >Download file</button>
              </div>

              <article
                v-else-if="docxHtml"
                class="prose prose-sm max-w-none docx-content"
                v-html="docxHtml"
              />
            </div>

            <div
              v-else
              class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white"
            >
              <div class="w-16 h-16 bg-[var(--line-soft)] rounded-full flex items-center justify-center mb-4">
                <BaseIcon name="file" size="32" class="text-[var(--ink-400)]" />
              </div>
              <h3 class="text-[16px] font-semibold text-[var(--ink-700)] mb-1">
                {{ hasFile ? 'Preview not available' : 'No file attached' }}
              </h3>
              <p class="text-[13px] text-[var(--ink-400)] max-w-xs">
                {{ hasFile ? 'This file type cannot be previewed in the browser.' : 'This policy document doesn\'t have a file uploaded yet.' }}
              </p>
              <button
                v-if="hasFile"
                @click="handleDownload"
                class="mt-4 px-4 py-2 bg-[var(--teal-700)] text-white rounded-lg text-[13px] font-semibold hover:bg-[var(--teal-800)] transition"
              >Download file</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Basic typography for rendered DOCX content */
.docx-content :deep(h1) { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.docx-content :deep(h2) { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
.docx-content :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
.docx-content :deep(p)  { margin: 0.5rem 0; line-height: 1.7; color: #374151; font-size: 14px; }
.docx-content :deep(ul),
.docx-content :deep(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
.docx-content :deep(li) { margin: 0.25rem 0; line-height: 1.6; font-size: 14px; }
.docx-content :deep(table) { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.docx-content :deep(td),
.docx-content :deep(th) { border: 1px solid #E5E7EB; padding: 6px 10px; font-size: 13px; }
.docx-content :deep(strong) { font-weight: 600; }
</style>
