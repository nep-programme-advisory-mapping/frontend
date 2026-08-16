<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    maxTags?: number
    placeholder?: string
    label?: string
    hint?: string
    error?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    maxTags: 5,
    placeholder: 'Add keyword...',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const isFocused = ref(false)
const localError = ref('')

// Stable unique ID — initialised once as a ref, not recomputed on every render
const inputId = props.id ?? `tag-input-${Math.random().toString(36).substring(2, 9)}`

// Focus the internal input element
const focusInput = () => {
  if (!props.disabled) {
    inputRef.value?.focus()
  }
}

// Watch input value: if they try to type/input anything while at maxTags limit,
// reject the input immediately and show the limit error. Otherwise, clear any local error.
const isProgrammaticClear = ref(false)

watch(inputValue, (newVal) => {
  if (isProgrammaticClear.value) {
    isProgrammaticClear.value = false
    return
  }

  if (newVal) {
    const candidates = newVal
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    const totalCount = (props.modelValue || []).length + candidates.length
    if (totalCount > props.maxTags) {
      localError.value = `You can only add up to ${props.maxTags} keywords.`
      isProgrammaticClear.value = true
      inputValue.value = ''
    } else {
      localError.value = ''
    }
  } else {
    localError.value = ''
  }
})

/**
 * Core insertion logic — shared by addTag() and handlePaste().
 * Takes an array of candidate strings, deduplicates them against existing
 * tags (case-insensitively), enforces the max-tag limit, and emits the
 * updated list when anything changed.
 */
const commitTags = (candidates: string[]) => {
  const updatedTags = [...(props.modelValue || [])]
  let hasChanges = false
  let limitExceeded = false

  for (const tag of candidates) {
    const isDuplicate = updatedTags.some((t) => t.toLowerCase() === tag.toLowerCase())
    if (isDuplicate) continue

    if (updatedTags.length >= props.maxTags) {
      limitExceeded = true
      break
    }

    updatedTags.push(tag)
    hasChanges = true
  }

  if (limitExceeded) {
    localError.value = `You can only add up to ${props.maxTags} keywords.`
  } else {
    localError.value = ''
  }

  if (hasChanges) {
    emit('update:modelValue', updatedTags)
  }
}

// Parse the current input value into candidates and commit them
const addTag = () => {
  if (props.disabled) return

  const rawValue = inputValue.value.trim()
  inputValue.value = ''
  if (!rawValue) return

  const candidates = rawValue
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  commitTags(candidates)
}

// Remove tag at a specific index
const removeTag = (index: number) => {
  if (props.disabled) return

  const updatedTags = [...(props.modelValue || [])]
  updatedTags.splice(index, 1)
  emit('update:modelValue', updatedTags)

  localError.value = ''

  // Refocus input to keep keyboard navigation flow intact
  focusInput()
}

// Remove the last tag (triggered on Backspace in an empty input)
const removeLastTag = () => {
  if (props.disabled || !props.modelValue?.length) return

  emit('update:modelValue', props.modelValue.slice(0, -1))
  localError.value = ''
}

// Handle keyboard events inside the input field
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault()
    addTag()
  } else if (event.key === 'Backspace' && !inputValue.value) {
    event.preventDefault()
    removeLastTag()
  }
}

// Handle input change — catches typed commas on mobile / IME keyboards
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value.includes(',') || target.value.includes(' ')) {
    inputValue.value = target.value
    addTag()
  }
}

// Handle paste — splits on commas/spaces and commits all candidates at once
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') || ''
  if (!text) return

  const fullText = inputValue.value + text
  inputValue.value = ''

  if (fullText.includes(',') || fullText.includes(' ')) {
    const candidates = fullText
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
    commitTags(candidates)
  } else {
    // No comma/space — treat as a single in-progress keyword, put it back in the input
    inputValue.value = fullText.trim()
  }
}
</script>

<template>
  <div class="field">
    <!-- Label and Counter -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between select-none"
    >
      <span>{{ label }}</span>
      <span class="text-xs text-gray-400 font-normal">
        {{ (modelValue || []).length }}/{{ maxTags }}
      </span>
    </label>

    <!-- Tag Input Container (Wrapper) -->
    <div
      class="flex flex-wrap gap-2 items-center w-full px-3 py-2 bg-white border rounded-lg shadow-sm transition-all text-sm cursor-text min-h-[44px]"
      :class="[
        isFocused ? 'ring-2 ring-teal-500 border-teal-500' : 'border-gray-300',
        disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : '',
        (error || localError) ? 'border-red-500 ring-2 ring-red-100' : '',
      ]"
      @click="focusInput"
    >
      <!-- Tags List -->
      <span
        v-for="(tag, index) in modelValue"
        :key="index"
        role="listitem"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--teal-50)] text-[var(--teal-800)] border border-[var(--teal-100)] rounded-md text-xs font-semibold select-none transition-colors"
      >
        <span>{{ tag }}</span>
        <button
          type="button"
          :disabled="disabled"
          class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[var(--teal-600)] hover:text-[var(--teal-800)] hover:bg-[var(--teal-100)]/50 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :aria-label="`Remove keyword ${tag}`"
          @click.stop="removeTag(index)"
        >
          <BaseIcon name="x" :size="10" />
        </button>
      </span>

      <!-- Hidden helper for screen reader keyword count -->
      <span class="sr-only" aria-live="polite">
        {{ (modelValue || []).length }} of {{ maxTags }} keywords added.
      </span>

      <!-- Native Input Field -->
      <input
        :id="inputId"
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="flex-1 min-w-[120px] bg-transparent border-0 p-0 text-gray-900 focus:ring-0 focus:outline-none sm:text-sm disabled:cursor-not-allowed placeholder-gray-400"
        @keydown="handleKeydown"
        @input="handleInput"
        @paste="handlePaste"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>

    <!-- Error or Hint Text -->
    <div v-if="error || localError" class="error mt-1.5 text-xs text-red-600 flex items-center gap-1 select-none">
      <BaseIcon name="alert" :size="14" />
      <span>{{ error || localError }}</span>
    </div>
    <div v-else-if="hint" class="hint mt-1.5 text-xs text-gray-400 select-none">
      {{ hint }}
    </div>
  </div>
</template>
