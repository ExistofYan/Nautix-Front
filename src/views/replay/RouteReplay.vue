<template>
  <div class="route-replay nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><Guide /></el-icon> 航线回放</h1>
      <el-select-v2 v-model="routeId" :options="routeOptions" filterable placeholder="选择航线" style="width: 300px" />
    </div>

    <div class="stat-row">
      <div class="stat-card nx-panel">
        <em>途经点总数</em>
        <b>{{ store.frameCount || '--' }}</b>
      </div>
      <div class="stat-card nx-panel">
        <em>计划里程</em>
        <b>{{ store.route?.distanceNm != null ? store.route.distanceNm.toFixed(1) + ' nm' : '--' }}</b>
      </div>
      <div class="stat-card nx-panel">
        <em>估算时长（按 {{ speedKn }} kn）</em>
        <b>{{ etaHours != null ? etaHours.toFixed(1) + ' h' : '--' }}</b>
      </div>
    </div>

    <ReplayPlayer v-if="routeId != null" :key="routeId" :route-id="routeId" />
    <el-empty v-else description="请选择一条航线" :image-size="90" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getRoutePage } from '@/api/route'
import { useReplayStore } from '@/stores/replay'
import ReplayPlayer from '@/components/replay/ReplayPlayer.vue'

const store = useReplayStore()
const routeId = ref<number | undefined>(undefined)
const routes = ref<{ id: number; routeName: string }[]>([])

/** 估算用巡航航速（节），后端无船-航线关联端点，取典型商船速度 */
const speedKn = 14

const routeOptions = computed(() => routes.value.map(r => ({ value: r.id, label: r.routeName })))

const etaHours = computed(() => {
  const d = store.route?.distanceNm
  return d != null && d > 0 ? d / speedKn : null
})

onMounted(async () => {
  try {
    const res = await getRoutePage({ page: 1, count: 50 })
    routes.value = (res.records ?? []).filter(r => r.id != null).map(r => ({ id: r.id as number, routeName: r.routeName ?? `航线 #${r.id}` }))
    if (routes.value.length > 0) routeId.value = routes.value[0].id
  } catch {
    routes.value = []
  }
})
</script>

<style scoped>
.route-replay { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
.stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.stat-card { border-radius: 14px; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
.stat-card em { font-style: normal; color: #64748b; font-size: 12.5px; letter-spacing: .5px; }
.stat-card b { color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 22px; font-weight: 800; }
</style>
