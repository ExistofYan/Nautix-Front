<template>
  <div class="nx-panel db-card">
    <div class="head">
      <span class="title"><el-icon><Coin /></el-icon> 库内数据量</span>
      <span class="stamp">{{ stampText }}</span>
    </div>

    <el-skeleton v-if="loading && !sys.stats" :rows="3" animated />
    <div v-else-if="sys.stats" class="gauges">
      <div v-for="g in gauges" :key="g.label" class="gauge">
        <div class="g-value">{{ g.value.toLocaleString() }}</div>
        <div class="g-label">{{ g.label }}</div>
        <div class="g-bar"><i :style="{ width: barPct(g.value) + '%', background: g.color }" /></div>
      </div>
    </div>
    <el-empty v-else description="暂无统计数据（后端未启动或接口失败）" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSystemStore } from '@/stores/system'

const sys = useSystemStore()
const loading = computed(() => !sys.stats)

const gauges = computed(() => {
  const s = sys.stats
  if (!s) return []
  return [
    { label: '船舶档案', value: s.shipCount ?? 0, color: 'linear-gradient(90deg,#38bdf8,#2563eb)' },
    { label: '告警记录', value: s.alertCount ?? 0, color: 'linear-gradient(90deg,#fb7185,#f472b6)' },
    { label: '传感器配置', value: s.sensorConfigCount ?? 0, color: 'linear-gradient(90deg,#34d399,#22d3ee)' },
    { label: '天气区域', value: s.weatherCount ?? 0, color: 'linear-gradient(90deg,#a78bfa,#7c3aed)' },
  ]
})

const maxVal = computed(() => Math.max(...gauges.value.map(g => g.value), 1))
function barPct(v: number) {
  return Math.max(4, Math.round((v / maxVal.value) * 100))
}

const stampText = ref('—')
watch(
  () => sys.lastRefresh,
  (t) => { stampText.value = t ? `更新于 ${new Date(t).toLocaleTimeString('zh-CN', { hour12: false })}` : '—' },
  { immediate: true },
)
</script>

<style scoped>
.db-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.stamp { font-size: 11.5px; color: #64748b; font-family: Consolas, monospace; }
.gauges { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.g-value { font-size: 26px; font-weight: 800; color: var(--nx-text); font-family: 'JetBrains Mono', Consolas, monospace; }
.g-label { font-size: 12px; color: var(--nx-text-dim); margin: 4px 0 8px; }
.g-bar { height: 5px; border-radius: 3px; background: rgba(148, 184, 232, 0.12); overflow: hidden; }
.g-bar i { display: block; height: 100%; border-radius: 3px; transition: width 0.6s ease; }
</style>
