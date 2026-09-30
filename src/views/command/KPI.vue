<template>
  <CommandLayout>
    <div class="kpi-page">
      <h2 class="sec-title">关键指标 · KEY PERFORMANCE</h2>
      <KPIWall />
      <AlertTicker class="gap" />
    </div>
  </CommandLayout>
</template>

<script setup lang="ts">
import CommandLayout from '@/layouts/CommandLayout.vue'
import KPIWall from '@/components/command/KPIWall.vue'
import AlertTicker from '@/components/command/AlertTicker.vue'
import { useCommand } from '@/hooks/useCommand'

/** KPI 全屏页。 */
useCommand()
</script>

<style scoped>
.kpi-page { display: flex; flex-direction: column; gap: 18px; }
.sec-title { margin: 0; color: #f1f5f9; font-size: 16px; letter-spacing: 2px; }
.gap { margin-top: 4px; }
</style>
