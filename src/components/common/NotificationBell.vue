<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useNotificationBell } from '@/composables/useNotificationBell'

const {
  store,
  open,
  bellRef,
  isRinging,
  handleNotificationClick,
  formatTime,
} = useNotificationBell()
</script>

<template>
  <!-- Bell button + dropdown -->
  <div ref="bellRef" class="relative">
    <button
      class="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      @click="open = !open"
      aria-label="Notifications"
    >
      <span :class="isRinging ? 'animate-ring' : ''" class="inline-flex">
        <BaseIcon name="bell" size="18" />
      </span>
      <span
        v-if="store.unreadCount > 0"
        class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
      >
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span class="text-sm font-semibold text-gray-800">Notifications</span>
        <button
          v-if="store.unreadCount > 0"
          class="text-xs text-teal-600 hover:text-teal-700 font-medium"
          @click="store.markAllRead()"
        >
          Mark all read
        </button>
      </div>

      <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
        <div v-if="store.loading" class="flex items-center justify-center py-8">
          <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <div v-else-if="store.items.length === 0" class="py-8 text-center text-sm text-gray-400">
          No notifications
        </div>

        <button
          v-for="n in store.items"
          :key="n.id"
          class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
          :class="{ 'bg-teal-50/60': !n.read_at }"
          @click="handleNotificationClick(n)"
        >
          <div class="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
            <BaseIcon name="file" size="13" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-gray-800 truncate">{{ n.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ n.message }}</p>
            <p class="text-[10px] text-gray-400 mt-1">{{ formatTime(n.created_at) }}</p>
          </div>
          <span v-if="!n.read_at" class="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-teal-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes ring {
  0%   { transform: rotate(0deg); }
  15%  { transform: rotate(20deg); }
  30%  { transform: rotate(-18deg); }
  45%  { transform: rotate(14deg); }
  60%  { transform: rotate(-10deg); }
  75%  { transform: rotate(6deg); }
  90%  { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
}

.animate-ring {
  animation: ring 0.9s ease-in-out;
  transform-origin: top center;
  display: inline-block;
}
</style>
