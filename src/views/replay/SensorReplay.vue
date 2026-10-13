<template>
  <div class="sensor-replay nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><Odometer /></el-icon> 传感器回放联动</h1>
      <div class="pickers">
        <el-select-v2 v-model="routeId" :options="routeOptions" filterable placeholder="选择航线" style="width: 240px" />
        <el-select-v2 v-model="shipId" :options="shipOptions" filterable clearable placeholder="选择船舶（可选）" style="width: 220px" />
      </div>
    </div>

    <div class="grid">
      <ReplayPlayer v-if="routeId != null" :key="routeId" :route-id="routeId" />
      <el-empty v-else description="请选择航线" :image-size="80" />

      <ReplayChart
        title="传感器趋势 · 游标随回放帧移动"
        :data="trendData"
        :cursor-index="cursorIndex"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getRoutePage } from '@/api/route'
import { getAllShipsCached } from '@/api/ship'
import { getSensorTrendData } from '@/api/sensor'
import type { SensorData } from '@/api/types'
import { useReplayStore } from '@/stores/replay'
import ReplayPlayer from '@/components/replay/ReplayPlayer.vue'
import ReplayChart from '@/components/replay/ReplayChart.vue'

const store = useReplayStore()
const routeId = ref<number | undefined>(undefined)
const shipId = ref<number | undefined>(undefined)
const routes = ref<{ id: number; routeName: string }[]>([])
const ships = ref<{ id: number; name: string }[]>([])
const trendData = ref<SensorData[]>([])

const routeOptions = computed(() => routes.value.map(r => ({ value: r.id, label: r.routeName })))
const shipOptions = computed(() => ships.value.map(s => ({ value: s.id, label: s.name })))

/** 回放帧序映射到趋势数据下标（线性比例） */
const cursorIndex = computed(() => {
  const n = store.frameCount
  if (n <= 1 || trendData.value.length === 0) return -1
  return Math.min(Math.round((store.currentIndex / (n - 1)) * (trendData.value.length - 1)), trendData.value.length - 1)
})

async function loadTrend() {
  try {
    const all = await getSensorTrendData(120)
    trendData.value = shipId.value == null ? (all ?? []) : (all ?? []).filter(d => d.shipId === shipId.value)
  } catch {
    trendData.value = []
  }
}

watch(shipId, () => void loadTrend())

onMounted(async () => {
  try {
    const [page, all] = await Promise.all([getRoutePage({ page: 1, count: 50 }), getAllShipsCached()])
    routes.value = (page.records ?? []).filter(r => r.id != null).map(r => ({ id: r.id as number, routeName: r.routeName ?? `航线 #${r.id}` }))
    ships.value = (all ?? []).filter(s => s.id != null).map(s => ({ id: s.id as number, name: s.shipName ?? `船 #${s.id}` }))
    if (routes.value.length > 0) routeId.value = routes.value[0].id
  } catch { /* 空态兜底 */ }
  void loadTrend()
})
</script>

<style scoped>
.sensor-replay { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
.pickers { display: flex; gap: 12px; flex-wrap: wrap; }
.grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap: 18px; align-items: start; }
@media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
</style>
