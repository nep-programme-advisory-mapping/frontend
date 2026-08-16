<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  type?: 'radio' | 'checkbox'
  modelValue?: string
  selectedValues?: string[]
  otherValue: string
  options: { value: string; label: string }[]
  label?: string
  placeholder?: string
  required?: boolean
  otherOptionValue?: string
}>(), {
  type: 'radio',
  modelValue: '',
  selectedValues: () => [],
  placeholder: 'Please specify',
  required: false,
  otherOptionValue: 'Other',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:selectedValues', value: string[]): void
  (e: 'update:otherValue', value: string): void
}>()

const inputId = ref('')
const error = ref<string | null>(null)

const showTextField = computed(() => {
  if (props.type === 'radio') return props.modelValue === props.otherOptionValue
  return props.selectedValues.includes(props.otherOptionValue)
})

const isChecked = (optValue: string): boolean => {
  if (props.type === 'radio') return props.modelValue === optValue
  return props.selectedValues.includes(optValue)
}

function handleRadioChange(value: string) {
  if (value !== props.otherOptionValue && props.otherValue) {
    emit('update:otherValue', '')
  }
  error.value = null
  emit('update:modelValue', value)
}

function handleCheckboxChange(value: string, checked: boolean) {
  const next = [...props.selectedValues]
  if (checked) {
    next.push(value)
  } else {
    const idx = next.indexOf(value)
    if (idx !== -1) next.splice(idx, 1)
    if (value === props.otherOptionValue) {
      emit('update:otherValue', '')
    }
  }
  error.value = null
  emit('update:selectedValues', next)
}

function handleOptionChange(value: string, checked: boolean) {
  if (props.type === 'radio') {
    handleRadioChange(value)
  } else {
    handleCheckboxChange(value, checked)
  }
}

function handleTextInput(e: Event) {
  error.value = null
  emit('update:otherValue', (e.target as HTMLInputElement).value)
}

function validate(): boolean {
  if (props.required && showTextField.value && !props.otherValue.trim()) {
    error.value = 'Please specify a value.'
    return false
  }
  error.value = null
  return true
}

defineExpose({ validate })

onMounted(() => {
  inputId.value = `other-specify-${Math.random().toString(36).substring(2, 9)}`
})
</script>

<template>
  <fieldset>
    <legend v-if="label" class="text-sm font-medium text-gray-700 mb-2">{{ label }}</legend>

    <div class="space-y-2">
      <label v-for="opt in options" :key="opt.value"
        class="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
        <input :type="type === 'radio' ? 'radio' : 'checkbox'" :value="opt.value" :checked="isChecked(opt.value)"
          @change="handleOptionChange(opt.value, ($event.target as HTMLInputElement).checked)"
          class="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 cursor-pointer" />
        {{ opt.label }}
      </label>
    </div>

    <div v-if="showTextField" class="mt-3">
      <label :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
        {{ placeholder }}
      </label>
      <input :id="inputId" type="text" :value="otherValue" @input="handleTextInput" :placeholder="placeholder"
        class="w-full border rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2"
        :class="error
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'" />
      <p v-if="error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
        <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd" />
        </svg>
        {{ error }}
      </p>
    </div>
  </fieldset>
</template>
