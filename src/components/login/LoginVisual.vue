<template>
  <div
    class="flex-[1.1] hidden lg:flex flex-col justify-center px-32 py-15 text-white relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700">
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(217,119,6,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_40%)]">
    </div>
    <div class="relative max-w-[440px]">
      <img src="@/assets/images/logoes/NEP-logoo.webp" alt="NEP Logo" class="w-20 mb-5.5" />
      <h1 class="text-3xl leading-tight font-semibold !text-white">
        The coordination layer for Cambodia's education NGOs.
      </h1>
      <p class="text-sm text-white/65 mt-3.5 leading-7">
        One structured map of programme activity across ~120 member organisations — used to spot overlap, surface
        complementary work, and generate advisory notes grounded in real data.
      </p>
      <div class="flex gap-6 mt-9">
        <div>
          <b class="block font-lexend text-2xl">120</b><span class="text-xs text-white/55 block">member
            organisations</span>
        </div>
        <div>
          <b class="block font-lexend text-2xl">25</b><span class="text-xs text-white/55 block">provinces mapped</span>
        </div>
        <div>
          <b class="block font-lexend text-2xl">9</b><span class="text-xs text-white/55 block">activity
            categories</span>
        </div>
      </div>
    </div>

    <!-- PN Footer -->
    <div class="absolute bottom-8 left-32 flex items-center gap-3">
      <span class="text-xs text-white/60">Developed by Passerelles Numériques Cambodia</span>
      <img src="@/assets/images/logoes/PN-logo.png" alt="Passerelles Numériques Cambodia" class="w-10 h-10 object-contain"/>
    </div>
  </div>
</template>
