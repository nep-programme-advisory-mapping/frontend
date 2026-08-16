<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import api from '@/api/axios'

const router = useRouter()

const query = ref('')
const mobileSearchOpen = ref(false)
const results = ref<{ type: 'programme' | 'organisation'; id: number; label: string; sub: string }[]>([])
const loading = ref(false)
const open = ref(false)

let debounceTimer: ReturnType<typeof setTimeout>

watch(query, (val) => {
  clearTimeout(debounceTimer)
  if (!val.trim()) {
    results.value = []
    open.value = false
    return
  }
  debounceTimer = setTimeout(() => search(val.trim()), 300)
})

async function search(q: string) {
  loading.value = true
  open.value = true
  try {
    const [progRes, orgRes] = await Promise.allSettled([
      api.get('/programme-entries', { params: { search: q, per_page: 5 } }),
      api.get('/admin/organisations', { params: { search: q, per_page: 5 } }),
    ])

    const programmes = progRes.status === 'fulfilled'
      ? (progRes.value.data?.data ?? progRes.value.data ?? [])
      : []

    const organisations = orgRes.status === 'fulfilled'
      ? (orgRes.value.data?.data ?? orgRes.value.data ?? [])
      : []

    results.value = [
      ...programmes.map((p: any) => ({
        type: 'programme' as const,
        id: p.id,
        label: p.programme_name ?? p.name ?? `Programme #${p.id}`,
        sub: p.organisation?.name ?? p.organisation_name ?? '',
      })),
      ...organisations.map((o: any) => ({
        type: 'organisation' as const,
        id: o.id,
        label: o.name,
        sub: o.email ?? '',
      })),
    ]
  } finally {
    loading.value = false
  }
}

function select(item: typeof results.value[0]) {
  query.value = ''
  open.value = false
  results.value = []
  if (item.type === 'programme') {
    router.push(`/entries/${item.id}`)
  } else {
    router.push('/admin/organization')
  }
}

function onBlur() {
  setTimeout(() => { open.value = false }, 150)
}
</script>

<template>
  <HeaderBreadcrumb title="Overview">
    <!-- Mobile search toggle -->
    <button
      class="md:hidden p-1.5 text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors"
      @click="mobileSearchOpen = !mobileSearchOpen"
      aria-label="Toggle search"
    >
      <BaseIcon :name="mobileSearchOpen ? 'x' : 'search'" :size="18" />
    </button>

    <!-- Desktop search -->
    <div class="relative w-72 hidden md:block">
      <span class="absolute inset-y-0 left-3 flex items-center text-[var(--ink-400)] pointer-events-none">
        <BaseIcon v-if="!loading" name="search" :size="15" />
        <svg v-else class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
      <input
        v-model="query"
        type="text"
        placeholder="Search programmes, organisations..."
        class="w-full pl-9 pr-4 py-[7px] text-[13px] bg-white border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--teal-600)] transition-colors"
        @focus="query.trim() && (open = true)"
        @blur="onBlur"
      />

      <!-- Desktop dropdown -->
      <div
        v-if="open"
        class="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-[var(--line)] z-50 overflow-hidden"
      >
        <div v-if="results.length === 0 && !loading" class="px-4 py-3 text-xs text-[var(--ink-400)]">
          No results found.
        </div>

        <template v-else>
          <div v-if="results.filter(r => r.type === 'programme').length">
            <div class="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-400)]">
              Programmes
            </div>
            <button
              v-for="item in results.filter(r => r.type === 'programme')"
              :key="`p-${item.id}`"
              class="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--teal-50)] transition-colors"
              @mousedown.prevent="select(item)"
            >
              <span class="shrink-0 w-6 h-6 rounded-md bg-[var(--teal-100)] flex items-center justify-center text-[var(--teal-800)]">
                <BaseIcon name="file" :size="12" />
              </span>
              <div class="min-w-0">
                <p class="text-[13px] font-medium text-[var(--ink-900)] truncate">{{ item.label }}</p>
                <p v-if="item.sub" class="text-[11px] text-[var(--ink-400)] truncate">{{ item.sub }}</p>
              </div>
            </button>
          </div>

          <div v-if="results.filter(r => r.type === 'organisation').length">
            <div class="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-400)]">
              Organisations
            </div>
            <button
              v-for="item in results.filter(r => r.type === 'organisation')"
              :key="`o-${item.id}`"
              class="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--teal-50)] transition-colors"
              @mousedown.prevent="select(item)"
            >
              <span class="shrink-0 w-6 h-6 rounded-md bg-[var(--amber-100)] flex items-center justify-center text-[var(--amber-700)]">
                <BaseIcon name="building" :size="12" />
              </span>
              <div class="min-w-0">
                <p class="text-[13px] font-medium text-[var(--ink-900)] truncate">{{ item.label }}</p>
                <p v-if="item.sub" class="text-[11px] text-[var(--ink-400)] truncate">{{ item.sub }}</p>
              </div>
            </button>
          </div>
        </template>
      </div>
    </div>
  </HeaderBreadcrumb>

  <!-- Mobile search panel -->
  <div
    v-if="mobileSearchOpen"
    class="md:hidden relative mx-2 mb-2"
  >
    <div class="relative">
      <span class="absolute inset-y-0 left-3 flex items-center text-[var(--ink-400)] pointer-events-none">
        <BaseIcon v-if="!loading" name="search" :size="15" />
        <svg v-else class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
      <input
        v-model="query"
        type="text"
        placeholder="Search programmes, organisations..."
        class="w-full pl-9 pr-4 py-[9px] text-[13px] bg-white border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--teal-600)] transition-colors"
        @focus="query.trim() && (open = true)"
        @blur="onBlur"
      />
    </div>

    <!-- Mobile dropdown -->
    <div
      v-if="open"
      class="mt-1 w-full bg-white rounded-xl shadow-lg border border-[var(--line)] z-50 overflow-hidden"
    >
      <div v-if="results.length === 0 && !loading" class="px-4 py-3 text-xs text-[var(--ink-400)]">
        No results found.
      </div>

      <template v-else>
        <div v-if="results.filter(r => r.type === 'programme').length">
          <div class="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-400)]">
            Programmes
          </div>
          <button
            v-for="item in results.filter(r => r.type === 'programme')"
            :key="`mp-${item.id}`"
            class="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--teal-50)] transition-colors"
            @mousedown.prevent="select(item)"
          >
            <span class="shrink-0 w-6 h-6 rounded-md bg-[var(--teal-100)] flex items-center justify-center text-[var(--teal-800)]">
              <BaseIcon name="file" :size="12" />
            </span>
            <div class="min-w-0">
              <p class="text-[13px] font-medium text-[var(--ink-900)] truncate">{{ item.label }}</p>
              <p v-if="item.sub" class="text-[11px] text-[var(--ink-400)] truncate">{{ item.sub }}</p>
            </div>
          </button>
        </div>

        <div v-if="results.filter(r => r.type === 'organisation').length">
          <div class="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-400)]">
            Organisations
          </div>
          <button
            v-for="item in results.filter(r => r.type === 'organisation')"
            :key="`mo-${item.id}`"
            class="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--teal-50)] transition-colors"
            @mousedown.prevent="select(item)"
          >
            <span class="shrink-0 w-6 h-6 rounded-md bg-[var(--amber-100)] flex items-center justify-center text-[var(--amber-700)]">
              <BaseIcon name="building" :size="12" />
            </span>
            <div class="min-w-0">
              <p class="text-[13px] font-medium text-[var(--ink-900)] truncate">{{ item.label }}</p>
              <p v-if="item.sub" class="text-[11px] text-[var(--ink-400)] truncate">{{ item.sub }}</p>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
