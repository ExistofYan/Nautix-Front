<template>
  <div class="ship-replay nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><Ship /></el-icon> 单船回放</h1>
      <el-select-v2 v-model="shipId" :options="shipOptions" filterable placeholder="选择船舶" style="width: 260px" />
    </div>

    <div v-if="runtime" class="now-card nx-panel">
      <div class="now-item"><em>当前位置</em><b>{{ runtime.longitude?.toFixed(4) }}°E / {{ runtime.latitude?.toFixed(4) }}°N</b></div>
      <div class="now-item"><em>航速</em><b>{{ fmt(runtime.speed) }} kn</b></div>
      <div class="now-item"><em>航向</em><b>{{ fmt(runtime.heading, 0) }}°</b></div>
      <div class="now-item"><em>状态</em><b>{{ runtime.sailingStatus ?? '--' }}</b></div>
      <div class="now-item"><em>最后更新</em><b>{{ (runtime.lastUpdate ?? '').replace('T', ' ').slice(0, 19) || '--' }}</b></div>
    </div>

    <ReplayPlayer v-if="routeId != null" :key="routeId" :route-id="routeId" />
    <el-empty v-else description="该船暂无关联航线，可在「航迹回放」中直接选航线播放" :image-size="90" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getAllShipsCached, getRuntimeByShip } from '@/api/ship'
import { getRoutePage } from '@/api/route'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'
import ReplayPlayer from '@/components/replay/ReplayPlayer.vue'

const ships = ref<ShipInfo[]>([])
const shipId = ref<number | undefined>(undefined)
const runtime = ref<ShipRuntimeStatus | null>(null)
const routeId = ref<number | undefined>(undefined)
const routes = ref<{ id: number }[]>([])

const shipOptions = computed(() =>
  ships.value.filter(s => s.id != null).map(s => ({ value: s.id as number, label: s.shipName ?? `船 #${s.id}` }))
)

function fmt(n?: number | null, d = 1) {
  return n == null || Number.isNaN(n) ? '--' : n.toFixed(d)
}

function pickRoute() {
  // 后端无船↔航线直连端点：按船序轮转分配一条航线作为演示回放对象
  if (routes.value.length > 0) {
    const idx = ships.value.findIndex(s => s.id === shipId.value)
    routeId.value = routes.value[Math.max(idx, 0) % routes.value.length].id
  } else {
    routeId.value = undefined
  }
}

watch(shipId, async id => {
  runtime.value = null
  if (id == null) return
  try {
    runtime.value = await getRuntimeByShip(id)
  } catch {
    runtime.value = null
  }
  pickRoute()
})

onMounted(async () => {
  try {
    const [all, page] = await Promise.all([getAllShipsCached(), getRoutePage({ page: 1, count: 50 })])
    ships.value = all ?? []
    routes.value = (page.records ?? []).filter(r => r.id != null).map(r => ({ id: r.id as number }))
    if (ships.value.length > 0 && ships.value[0].id != null) shipId.value = ships.value[0].id
  } catch {
    ships.value = []
  }
})
</script>

<style scoped>
.ship-replay { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
.now-card { display: flex; gap: 28px; flex-wrap: wrap; border-radius: 14px; padding: 14px 22px; }
.now-item { display: flex; flex-direction: column; gap: 4px; }
.now-item em { font-style: normal; color: #64748b; font-size: 12px; }
.now-item b { color: #e0f2fe; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 14px; font-weight: 600; }
</style>
