<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import api from '@/api/axios'

const router = useRouter()

const query = ref('')
const mobileSearchOpen = ref(false)
const mobileInputRef = ref<HTMLInputElement | null>(null)
const desktopInputRef = ref<HTMLInputElement | null>(null)
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

let mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null
let mql: MediaQueryList | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    mql = window.matchMedia('(min-width: 768px)')
    mediaQueryHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        mobileSearchOpen.value = false
      }
    }
    mql.addEventListener('change', mediaQueryHandler)
  }
})

onUnmounted(() => {
  if (mql && mediaQueryHandler) {
    mql.removeEventListener('change', mediaQueryHandler)
  }
})

async function search(q: string) {
  loading.value = true
  open.value = true
  try {
    const [progRes, orgRes] = await Promise.allSettled([
      api.get('/programme-entries', { params: { search: q, per_page: 50 } }),
      api.get('/admin/organisations', { params: { search: q, per_page: 50 } }),
    ])

    const lq = q.toLowerCase()

    const allProgrammes: any[] = progRes.status === 'fulfilled'
      ? (progRes.value.data?.data ?? progRes.value.data ?? [])
      : []

    const allOrganisations: any[] = orgRes.status === 'fulfilled'
      ? (orgRes.value.data?.data ?? orgRes.value.data ?? [])
      : []

    // Client-side filter as fallback in case the backend ignores `search`
    const programmes = allProgrammes.filter((p: any) => {
      const name = (p.programme_name ?? p.name ?? '').toLowerCase()
      const org = (p.organisation?.name ?? p.organisation_name ?? '').toLowerCase()
      return name.includes(lq) || org.includes(lq)
    })

    const organisations = allOrganisations.filter((o: any) => {
      const name = (o.name ?? '').toLowerCase()
      const email = (o.email ?? '').toLowerCase()
      return name.includes(lq) || email.includes(lq)
    })

    results.value = [
      ...programmes.slice(0, 5).map((p: any) => ({
        type: 'programme' as const,
        id: p.id,
        label: p.programme_name ?? p.name ?? `Programme #${p.id}`,
        sub: p.organisation?.name ?? p.organisation_name ?? '',
      })),
      ...organisations.slice(0, 5).map((o: any) => ({
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
  mobileSearchOpen.value = false
  results.value = []
  if (item.type === 'programme') {
    router.push(`/entries/${item.id}`)
  } else {
    router.push('/admin/organization')
  }
}

function openMobileSearch() {
  mobileSearchOpen.value = true
  nextTick(() => {
    mobileInputRef.value?.focus()
    if (query.value.trim()) {
      open.value = true
    }
  })
}

function closeMobileSearch() {
  mobileSearchOpen.value = false
  open.value = false
  query.value = ''
  results.value = []
}

function clearQuery() {
  query.value = ''
  results.value = []
  open.value = false
}

function onBlur() {
  setTimeout(() => { open.value = false }, 200)
}
</script>

<template>
  <div class="relative w-full flex items-center justify-between min-w-0">
    <!-- 1. Normal Breadcrumb View (Desktop always; Mobile when mobileSearchOpen is false) -->
    <div v-show="!mobileSearchOpen" class="w-full flex items-center justify-between min-w-0">
      <HeaderBreadcrumb title="Overview">
        <!-- Mobile search toggle button -->
        <button
          type="button"
          class="md:hidden p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          @click="openMobileSearch"
          aria-label="Open search"
        >
          <BaseIcon name="search" :size="18" />
        </button>

        <!-- Desktop search bar -->
        <div class="relative w-72 lg:w-80 hidden md:block">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
            <BaseIcon v-if="!loading" name="search" :size="15" />
            <svg v-else class="animate-spin w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
          <input
            ref="desktopInputRef"
            v-model="query"
            type="text"
            placeholder="Search programmes, organisations..."
            class="w-full pl-9 pr-8 py-1.5 text-[13px] bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-colors text-slate-800 placeholder-slate-400"
            @focus="query.trim() && (open = true)"
            @blur="onBlur"
          />
          <button
            v-if="query"
            type="button"
            @mousedown.prevent="clearQuery"
            class="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Clear search"
          >
            <BaseIcon name="x" :size="13" />
          </button>

          <!-- Desktop dropdown -->
          <div
            v-if="open && !mobileSearchOpen"
            class="absolute top-full right-0 mt-1.5 w-full min-w-[320px] max-w-[400px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[70vh] overflow-y-auto"
          >
            <div v-if="results.length === 0 && !loading" class="px-4 py-3 text-xs text-slate-400">
              No results found.
            </div>

            <template v-else>
              <div v-if="results.filter(r => r.type === 'programme').length">
                <div class="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Programmes
                </div>
                <button
                  v-for="item in results.filter(r => r.type === 'programme')"
                  :key="`dp-${item.id}`"
                  type="button"
                  class="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-teal-50/70 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                  @mousedown.prevent="select(item)"
                >
                  <span class="shrink-0 w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                    <BaseIcon name="file" :size="12" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-medium text-slate-900 truncate">{{ item.label }}</p>
                    <p v-if="item.sub" class="text-[11px] text-slate-500 truncate">{{ item.sub }}</p>
                  </div>
                </button>
              </div>

              <div v-if="results.filter(r => r.type === 'organisation').length">
                <div class="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Organisations
                </div>
                <button
                  v-for="item in results.filter(r => r.type === 'organisation')"
                  :key="`do-${item.id}`"
                  type="button"
                  class="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50/70 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                  @mousedown.prevent="select(item)"
                >
                  <span class="shrink-0 w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                    <BaseIcon name="building" :size="12" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-medium text-slate-900 truncate">{{ item.label }}</p>
                    <p v-if="item.sub" class="text-[11px] text-slate-500 truncate">{{ item.sub }}</p>
                  </div>
                </button>
              </div>
            </template>
          </div>
        </div>
      </HeaderBreadcrumb>
    </div>

    <!-- 2. Mobile Full-Width Search Bar (Shown when mobileSearchOpen is true on small screens) -->
    <div
      v-if="mobileSearchOpen"
      class="md:hidden flex items-center gap-2 w-full min-w-0"
    >
      <div class="relative flex-1 min-w-0">
        <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
          <BaseIcon v-if="!loading" name="search" :size="15" />
          <svg v-else class="animate-spin w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
        <input
          ref="mobileInputRef"
          v-model="query"
          type="text"
          placeholder="Search programmes, organisations..."
          class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-slate-800 placeholder-slate-400"
          @focus="query.trim() && (open = true)"
          @blur="onBlur"
        />
        <button
          v-if="query"
          type="button"
          @mousedown.prevent="clearQuery"
          class="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          aria-label="Clear query"
        >
          <BaseIcon name="x" :size="14" />
        </button>
      </div>

      <button
        type="button"
        @click="closeMobileSearch"
        class="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
      >
        Cancel
      </button>

      <!-- Mobile Dropdown -->
      <div
        v-if="open"
        class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-[60vh] overflow-y-auto"
      >
        <div v-if="results.length === 0 && !loading" class="px-4 py-3 text-xs text-slate-400">
          No results found.
        </div>

        <template v-else>
          <div v-if="results.filter(r => r.type === 'programme').length">
            <div class="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Programmes
            </div>
            <button
              v-for="item in results.filter(r => r.type === 'programme')"
              :key="`mp-${item.id}`"
              type="button"
              class="w-full text-left flex items-center gap-3 px-3.5 py-2.5 hover:bg-teal-50/70 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
              @mousedown.prevent="select(item)"
            >
              <span class="shrink-0 w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <BaseIcon name="file" :size="14" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs sm:text-[13px] font-semibold text-slate-900 truncate">{{ item.label }}</p>
                <p v-if="item.sub" class="text-[11px] text-slate-500 truncate mt-0.5">{{ item.sub }}</p>
              </div>
            </button>
          </div>

          <div v-if="results.filter(r => r.type === 'organisation').length">
            <div class="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Organisations
            </div>
            <button
              v-for="item in results.filter(r => r.type === 'organisation')"
              :key="`mo-${item.id}`"
              type="button"
              class="w-full text-left flex items-center gap-3 px-3.5 py-2.5 hover:bg-amber-50/70 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
              @mousedown.prevent="select(item)"
            >
              <span class="shrink-0 w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <BaseIcon name="building" :size="14" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs sm:text-[13px] font-semibold text-slate-900 truncate">{{ item.label }}</p>
                <p v-if="item.sub" class="text-[11px] text-slate-500 truncate mt-0.5">{{ item.sub }}</p>
              </div>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

