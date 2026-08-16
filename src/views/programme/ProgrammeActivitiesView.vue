<script setup lang="ts">
import TaxonomySelector from '../../components/programme/TaxonomySelector.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Programme Activities</h1>
        <p class="mt-2 text-sm text-slate-600">
          Configure the taxonomy structure and select the relevant activities for this programme phase.
        </p>
      </div>
      <main>
        <TaxonomySelector />
      </main>
    </div>
  </div>
</template>
