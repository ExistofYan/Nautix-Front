<template>
  <footer class="dock">
    <div class="dock-inner">
      <span v-for="k in quick" :key="k.label" class="dock-item">
        <el-icon class="dock-ico"><component :is="k.icon" /></el-icon>
        <span class="dock-label">{{ k.label }}</span>
        <b class="dock-value">{{ k.value }}</b>
      </span>
      <span class="dock-time">{{ updatedText }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCommandStore } from '@/stores/command'

const store = useCommandStore()

const quick = computed(() => [
  { label: '船舶', value: String(store.runtime.length), icon: 'Ship' },
  { label: '待处理告警', value: String(store.pendingAlertCount), icon: 'Bell' },
  { label: '传感器配置', value: String(store.stats?.sensorConfigCount ?? '--'), icon: 'Odometer' },
  { label: '天气区域', value: String(store.stats?.weatherCount ?? '--'), icon: 'PartlyCloudy' },
])

const updatedText = computed(() => {
  if (store.lastRefresh == null) return '尚未刷新'
  return `更新于 ${new Date(store.lastRefresh).toLocaleTimeString('zh-CN', { hour12: false })}`
})
</script>

<style scoped>
.dock {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 10;
}
.dock-inner {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 12px 26px;
  border-radius: 999px;
  background: rgba(10, 25, 45, 0.78);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 12px 32px rgba(2, 8, 23, 0.55);
}
.dock-item { display: inline-flex; align-items: center; gap: 7px; color: #a8bdd9; font-size: 12.5px; white-space: nowrap; }
.dock-ico { color: #38bdf8; }
.dock-value { color: #f1f5f9; font-size: 14px; font-variant-numeric: tabular-nums; }
.dock-time { color: #475569; font-size: 11.5px; margin-left: 4px; }
</style>
