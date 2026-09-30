<template>
  <section class="screen">
    <div class="banner">
      <h1>海上交通指挥中心 <em>MARITIME COMMAND</em></h1>
      <span class="stamp">{{ stamp }}</span>
    </div>

    <KPIWall />

    <div class="grid">
      <div class="col"><TrafficMonitor /></div>
      <div class="col"><EmergencyPanel /></div>
      <div class="col"><GlobalShipCounter /></div>
    </div>

    <AlertTicker class="ticker-row" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import KPIWall from '@/components/command/KPIWall.vue'
import TrafficMonitor from '@/components/command/TrafficMonitor.vue'
import EmergencyPanel from '@/components/command/EmergencyPanel.vue'
import GlobalShipCounter from '@/components/command/GlobalShipCounter.vue'
import AlertTicker from '@/components/command/AlertTicker.vue'
import { useCommand } from '@/hooks/useCommand'

/** 大屏主视觉：KPI 墙 + 三列（节律/应急/全球计数）+ 底部滚动告警。 */
useCommand()

const stamp = ref('')
let timer: number | undefined
onMounted(() => {
  const upd = () => {
    stamp.value = new Date().toLocaleString('zh-CN', { hour12: false }) + ' · SYD'
  }
  upd()
  timer = window.setInterval(upd, 1000)
})
onUnmounted(() => { if (timer !== undefined) clearInterval(timer) })
</script>

<style scoped>
.screen { display: flex; flex-direction: column; gap: 18px; }
.banner { display: flex; align-items: baseline; justify-content: space-between; padding: 4px 4px 0; }
.banner h1 { margin: 0; font-size: 22px; letter-spacing: 2px; color: #f1f5f9; }
.banner em { font-style: normal; font-size: 12px; letter-spacing: 4px; color: #7dd3fc; margin-left: 10px; }
.stamp { font-family: Consolas, monospace; font-size: 12.5px; color: #64748b; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; align-items: stretch; }
.col { min-width: 0; display: flex; flex-direction: column; }
.col > * { flex: 1; }
.ticker-row { margin-top: 2px; }
@media (max-width: 1280px) { .grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
</style>
