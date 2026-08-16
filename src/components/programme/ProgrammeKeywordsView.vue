<script setup lang="ts">
import { watch } from 'vue'
import { useProgrammeKeywordsStore } from '@/stores/programmeKeywords'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
  }>(),
  {
    modelValue: () => [],
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const store = useProgrammeKeywordsStore()

watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(store.keywordsData)) {
    store.initKeywords(newVal || [])
  }
}, { deep: true, immediate: true })

watch(store.keywordsData, (newVal) => {
  emit('update:modelValue', newVal)
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6">
      <div class="mb-6">
        <p class="text-sm text-gray-500">
          Enter at least 1 keyword (up to 5 keywords) describing what is distinctive about this programme. Examples: system strengthening, locally led, research-based, handover model, inclusion-focused, community-driven, digital learning, gender transformative, evidence-based, language minority, rural remote.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
        <div>
          <label for="keyword1" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 1 <span class="text-red-500">*</span>
          </label>
          <input
            id="keyword1"
            v-model="store.keyword1"
            type="text"
            placeholder="e.g. system strengthening"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword2" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 2 <span class="text-gray-400 text-xs font-normal">(optional)</span>
          </label>
          <input
            id="keyword2"
            v-model="store.keyword2"
            type="text"
            placeholder="e.g. locally led"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword3" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 3 <span class="text-gray-400 text-xs font-normal">(optional)</span>
          </label>
          <input
            id="keyword3"
            v-model="store.keyword3"
            type="text"
            placeholder="e.g. digital learning"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword4" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 4 <span class="text-gray-400 text-xs font-normal">(optional)</span>
          </label>
          <input
            id="keyword4"
            v-model="store.keyword4"
            type="text"
            placeholder="e.g. inclusion-focused"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label for="keyword5" class="block text-sm font-medium text-gray-700 mb-1.5">
            Keyword 5 <span class="text-gray-400 text-xs font-normal">(optional)</span>
          </label>
          <input
            id="keyword5"
            v-model="store.keyword5"
            type="text"
            placeholder="e.g. community-driven"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
