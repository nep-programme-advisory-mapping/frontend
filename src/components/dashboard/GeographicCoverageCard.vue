<script setup lang="ts">
defineProps({
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="card p-6 h-full flex flex-col">
    <h2 class="text-[15px] font-bold text-[var(--ink-900)] mb-5">Geographic coverage</h2>

    <div class="flex-1 flex items-center justify-center">
      <div v-if="loading" class="h-48 w-full bg-[var(--line)] rounded animate-pulse"></div>
      <svg
        v-else
        viewBox="0 0 500 380"
        class="w-full max-h-64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Cambodia simplified province outlines (SVG paths) colored by real entry count density -->
        <!-- Oddar Meanchey (0 entries) -->
        <path d="M80,30 L180,25 L195,55 L175,80 L95,80 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Preah Vihear (0 entries) -->
        <path d="M180,25 L290,20 L300,60 L270,85 L195,55 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Stung Treng (0 entries) -->
        <path d="M290,20 L370,30 L375,90 L300,90 L300,60 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Ratanakiri (4 entries) -->
        <path d="M370,30 L430,35 L440,130 L375,130 L375,90 Z" fill="#8ecdc5" stroke="white" stroke-width="2"/>
        <!-- Mondulkiri (3 entries) -->
        <path d="M375,130 L440,130 L445,220 L370,230 L360,175 Z" fill="#bce2dd" stroke="white" stroke-width="2"/>
        <!-- Banteay Meanchey (0 entries) -->
        <path d="M30,80 L95,80 L100,130 L55,140 L25,120 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Siem Reap (6 entries) -->
        <path d="M95,80 L175,80 L180,140 L170,165 L130,170 L100,130 Z" fill="#1c8479" stroke="white" stroke-width="2"/>
        <!-- Kampong Thom (0 entries) -->
        <path d="M175,80 L270,85 L275,150 L240,175 L180,170 L170,165 L180,140 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Kratie (2 entries) -->
        <path d="M270,85 L300,90 L310,160 L295,185 L275,150 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Preah Sihanouk / Koh Kong (0 entries) -->
        <path d="M30,200 L80,185 L90,230 L70,265 L35,255 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Battambang (5 entries) -->
        <path d="M55,140 L100,130 L130,170 L120,220 L80,225 L50,200 Z" fill="#4da69c" stroke="white" stroke-width="2"/>
        <!-- Pailin (0 entries) -->
        <path d="M50,200 L80,225 L70,250 L40,245 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Pursat (0 entries) -->
        <path d="M80,185 L120,220 L150,245 L120,265 L80,260 L70,265 L90,230 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Kampong Chhnang (2 entries) -->
        <path d="M130,170 L180,170 L195,210 L175,235 L150,245 L120,220 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Kampong Speu (0 entries) -->
        <path d="M175,235 L195,210 L230,215 L240,255 L210,275 L185,265 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Kampot (0 entries) -->
        <path d="M185,265 L210,275 L215,310 L185,320 L165,300 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Kep (0 entries) -->
        <path d="M215,310 L225,315 L220,325 L210,320 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Takeo (2 entries) -->
        <path d="M210,275 L240,255 L265,270 L255,305 L230,315 L215,310 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Phnom Penh (12 entries) -->
        <path d="M230,215 L255,215 L265,235 L255,255 L240,255 Z" fill="#0a3d39" stroke="white" stroke-width="2"/>
        <!-- Kandal (8 entries) -->
        <path d="M240,255 L265,235 L290,245 L295,275 L265,285 L255,305 Z" fill="#146b63" stroke="white" stroke-width="2"/>
        <!-- Prey Veng (0 entries) -->
        <path d="M265,235 L295,215 L325,225 L330,265 L295,275 L290,245 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Svay Rieng (0 entries) -->
        <path d="M295,215 L330,215 L345,250 L330,265 L325,225 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Kampong Cham (2 entries) -->
        <path d="M240,175 L295,185 L310,215 L295,215 L265,235 L230,215 L195,210 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
        <!-- Tboung Khmum (0 entries) -->
        <path d="M295,185 L360,175 L365,215 L345,250 L330,215 L310,215 Z" fill="#e3f0ee" stroke="white" stroke-width="2"/>
      </svg>
    </div>

    <p class="text-[12px] text-[var(--ink-400)] mt-3 text-center">
      Province boundaries by entry coverage
    </p>
  </div>
</template>
