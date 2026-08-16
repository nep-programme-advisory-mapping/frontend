<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
</script>

<template>
  <div class="mt-8">
    <div class="text-lg font-semibold text-gray-900 mb-2"><h3>Guidance</h3></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card card-pad">
        <div style="color:var(--teal-700);margin-bottom:10px;"><BaseIcon name="alert" :size="20" /></div>
        <b style="font-size:13.5px;">Why entries get flagged</b>
        <p style="font-size:12.4px;color:var(--ink-500);margin-top:6px;">Entries not updated within 18 months are automatically marked unverified. They stay in the map and in advisory analyses, just flagged as potentially outdated.</p>
      </div>
      <div class="card card-pad">
        <div style="color:var(--amber-700);margin-bottom:10px;"><BaseIcon name="bolt" :size="20" /></div>
        <b style="font-size:13.5px;">Let AI draft your first pass</b>
        <p style="font-size:12.4px;color:var(--ink-500);margin-top:6px;">Paste a description of your programme in Step 2 and the system will suggest activity tags to review — nothing saves until you confirm.</p>
      </div>
      <div class="card card-pad">
        <div style="color:var(--indigo-600);margin-bottom:10px;"><BaseIcon name="lock" :size="20" /></div>
        <b style="font-size:13.5px;">Your data stays yours</b>
        <p style="font-size:12.4px;color:var(--ink-500);margin-top:6px;">Visibility of your entries to other members is currently restricted pending a board decision — only NEP staff can see the full map.</p>
      </div>
    </div>
  </div>
</template>
