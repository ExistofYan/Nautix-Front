<template>
  <CommandLayout>
    <div class="emg-page">
      <EmergencyPanel />
    </div>
  </CommandLayout>
</template>

<script setup lang="ts">
import CommandLayout from '@/layouts/CommandLayout.vue'
import EmergencyPanel from '@/components/command/EmergencyPanel.vue'
import { useCommand } from '@/hooks/useCommand'

/** 应急大屏页：待处理告警全列表。 */
useCommand()
</script>

<style scoped>
.emg-page { max-width: 980px; margin: 0 auto; width: 100%; }
.emg-page > * { min-height: 60vh; }
</style>
