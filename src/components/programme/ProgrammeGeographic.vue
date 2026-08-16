<script setup lang="ts">
import { onMounted } from 'vue'
import { useProgrammeGeographyStore } from '@/stores/programmeGeography'

const store = useProgrammeGeographyStore()

function validate(): boolean {
    return true
}

function getData() {
    return store.getData()
}

defineExpose({ validate, getData })

onMounted(() => {
    store.loadProvinces()
})
</script>

<template>
    <div class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 3: Geographic coverage</h3>
        <p class="text-sm text-gray-500 mb-6">
            Select the provinces, districts, communes, and villages where this programme operates.
        </p>

        <!-- Loading state -->
        <div v-if="store.loadingProvinces" class="flex items-center gap-2 text-sm text-gray-400 py-4">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading provinces…
        </div>

        <!-- Error state -->
        <div v-else-if="store.provincesError" class="flex items-center gap-3 py-4">
            <span class="text-sm text-red-600">{{ store.provincesError }}</span>
            <button @click="store.loadProvinces" class="text-sm font-medium text-teal-700 hover:text-teal-600 underline">
                Retry
            </button>
        </div>

        <!-- Province pills -->
        <div v-else class="mt-6">
            <label class="block text-xs font-semibold text-gray-700 mb-2.5">Select all provinces where this programme currently operates</label>
            <div class="flex flex-wrap gap-2 mb-5">
                <label v-for="p in store.provinces" :key="p.id"
                    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer border transition-all select-none"
                    :class="store.provinceIds.includes(p.id)
                        ? 'bg-teal-800 text-white border-teal-800 hover:bg-teal-700 hover:border-teal-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                    <input type="checkbox" :checked="store.provinceIds.includes(p.id)"
                        @change="store.toggleProvince(p.id)" class="hidden" />
                    {{ p.province_name }}
                </label>
            </div>

            <!-- District / Commune / Village sections -->
            <template v-if="store.provinceIds.length">
                <div class="h-px bg-gray-200 my-4"></div>

                <div v-for="pid in store.provinceIds" :key="pid" class="mb-6">
                    <!-- Province header + toggle districts -->
                    <div class="flex items-center justify-between text-[13px] font-semibold text-gray-700 mb-2">
                        <div class="flex flex-wrap items-center gap-1.5 max-w-[70%]">
                            <span>{{ store.provinceNameById[pid] || `Province #${pid}` }}</span>
                            <div v-if="!store.expandedProvinces.has(pid) && store.districts[pid]?.length" class="flex flex-wrap gap-1 items-center">
                                <span v-for="did in store.districts[pid]" :key="did" class="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5">
                                    {{ store.districtNameById[did] }}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-transparent border border-teal-200 rounded-md px-2.5 py-1 cursor-pointer transition-all hover:bg-teal-50 hover:border-teal-400"
                            @click.stop="store.toggleDistrictVisibility(pid)">
                            <template v-if="store.expandedProvinces.has(pid)">
                                Hide districts
                                <svg height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                    <path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/>
                                </svg>
                            </template>
                            <template v-else>
                                Select districts
                                <template v-if="store.districts[pid]?.length">
                                    ({{ store.districts[pid].length }} selected)
                                </template>
                                <svg height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                                </svg>
                            </template>
                        </button>
                    </div>

                    <!-- District pills -->
                    <div v-if="store.expandedProvinces.has(pid)">
                        <!-- Loading districts -->
                        <div v-if="store.loadingDistricts.has(pid)" class="flex items-center gap-2 text-xs text-gray-400 py-2">
                            <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Loading districts…
                        </div>

                        <div v-else-if="store.districtsCache[pid]?.length" class="flex flex-wrap gap-2 mb-3">
                            <label v-for="d in store.districtsCache[pid]" :key="d.id"
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all select-none"
                                :class="store.districts[pid]?.includes(d.id)
                                    ? 'bg-teal-800 text-white border-teal-800 hover:bg-teal-700 hover:border-teal-700'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                                <input type="checkbox" :checked="store.districts[pid]?.includes(d.id)"
                                    @change="store.toggleDistrict(pid, d.id)" class="hidden" />
                                {{ d.name }}
                            </label>
                        </div>

                        <div v-else class="text-xs text-gray-400 py-1">No districts available</div>

                        <!-- Communes under each selected district -->
                        <div v-for="did in (store.districts[pid] || [])" :key="did" class="ml-6 mb-3 border-l-2 border-gray-100 pl-4">
                            <div class="flex items-center justify-between text-[12px] font-semibold text-gray-600 mb-1.5">
                                <div class="flex flex-wrap items-center gap-1.5 max-w-[70%]">
                                    <span>{{ store.districtNameById[did] || `District #${did}` }}</span>
                                    <div v-if="!store.expandedDistricts.has(did) && store.communes[did]?.length" class="flex flex-wrap gap-1 items-center">
                                        <span v-for="cid in store.communes[did]" :key="cid" class="text-[10px] font-medium text-teal-800 bg-teal-50 border border-teal-100 rounded px-1 py-0.25">
                                            {{ store.communeNameById[cid] }}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 bg-transparent border border-teal-200 rounded-md px-2 py-0.5 cursor-pointer transition-all hover:bg-teal-50"
                                    @click.stop="store.toggleCommuneVisibility(did)">
                                    <template v-if="store.expandedDistricts.has(did)">
                                        Hide communes
                                        <svg height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                                            <path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/>
                                        </svg>
                                    </template>
                                    <template v-else>
                                        Select communes
                                        <template v-if="store.communes[did]?.length">
                                            ({{ store.communes[did].length }} selected)
                                        </template>
                                        <svg height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                                            <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                                        </svg>
                                    </template>
                                </button>
                            </div>

                            <!-- Commune pills -->
                            <div v-if="store.expandedDistricts.has(did)">
                                <div v-if="store.loadingCommunes.has(did)" class="flex items-center gap-2 text-xs text-gray-400 py-1">
                                    <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Loading communes…
                                </div>

                                <div v-else-if="store.communesCache[did]?.length" class="flex flex-wrap gap-1.5 mb-2">
                                    <label v-for="c in store.communesCache[did]" :key="c.id"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer border transition-all select-none"
                                        :class="store.communes[did]?.includes(c.id)
                                            ? 'bg-teal-700 text-white border-teal-700'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                                        <input type="checkbox" :checked="store.communes[did]?.includes(c.id)"
                                            @change="store.toggleCommune(did, c.id)" class="hidden" />
                                        {{ c.name }}
                                    </label>
                                </div>

                                <div v-else class="text-xs text-gray-400 py-0.5">No communes available</div>

                                <!-- Villages under each selected commune -->
                                <div v-for="cid in (store.communes[did] || [])" :key="cid" class="ml-5 mb-2 border-l-2 border-gray-100 pl-3">
                                    <div class="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
                                        <div class="flex flex-wrap items-center gap-1.5 max-w-[70%]">
                                            <span>{{ store.communeNameById[cid] || `Commune #${cid}` }}</span>
                                            <div v-if="!store.expandedCommunes.has(cid) && store.villages[cid]?.length" class="flex flex-wrap gap-1 items-center">
                                                <span v-for="vid in store.villages[cid]" :key="vid" class="text-[9px] font-medium text-teal-800 bg-teal-50 border border-teal-100 rounded px-1 py-0.25">
                                                    {{ store.villageNameById[vid] }}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1 text-[10px] font-medium text-teal-500 bg-transparent border border-teal-200 rounded-md px-1.5 py-0.5 cursor-pointer transition-all hover:bg-teal-50"
                                            @click.stop="store.toggleVillageVisibility(cid)">
                                            <template v-if="store.expandedCommunes.has(cid)">
                                                Hide villages
                                            </template>
                                            <template v-else>
                                                Select villages
                                                <template v-if="store.villages[cid]?.length">
                                                    ({{ store.villages[cid].length }} selected)
                                                </template>
                                            </template>
                                        </button>
                                    </div>

                                    <!-- Village pills -->
                                    <div v-if="store.expandedCommunes.has(cid)">
                                        <div v-if="store.loadingVillages.has(cid)" class="flex items-center gap-2 text-xs text-gray-400 py-1">
                                            <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Loading villages…
                                        </div>

                                        <div v-else-if="store.villagesCache[cid]?.length" class="flex flex-wrap gap-1">
                                            <label v-for="v in store.villagesCache[cid]" :key="v.id"
                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border transition-all select-none"
                                                :class="store.villages[cid]?.includes(v.id)
                                                    ? 'bg-teal-600 text-white border-teal-600'
                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-teal-400 hover:bg-teal-50'">
                                                <input type="checkbox" :checked="store.villages[cid]?.includes(v.id)"
                                                    @change="store.toggleVillage(cid, v.id)" class="hidden" />
                                                {{ v.name }}
                                            </label>
                                        </div>

                                        <div v-else class="text-xs text-gray-400 py-0.5">No villages available</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div class="h-px bg-gray-200 my-4"></div>
            <div>
                <label class="block text-xs font-semibold text-gray-700 mb-2">Other countries (if applicable)</label>
                <input type="text" v-model="store.otherCountries" placeholder="Leave blank if Cambodia-only"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400" />
            </div>
        </div>
    </div>
</template>
