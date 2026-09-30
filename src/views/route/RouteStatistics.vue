<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">航线里程分析</h2>
        <p class="nx-page-desc">全站航线里程画像（/route/page × /route-point 前端聚合）</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div v-loading="store.loading && !profiles.length" class="rst-grid">
      <RouteStatistics :profiles="profiles" />

      <div class="nx-panel rst-scatter">
        <div class="sc-title">里程 × 点数散点</div>
        <div ref="scatterEl" class="sc-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { useRouteStore } from '@/stores/route'
import RouteStatistics from '@/components/route/RouteStatistics.vue'
import type { Route } from '@/api/types'
import type { RouteProfile } from '@/types/route'

const store = useRouteStore()
const scatterEl = ref<HTMLElement>()
const { setOption } = useChart(scatterEl)

const profiles = computed<RouteProfile[]>(() =>
  store.routes
    .filter((r: Route): r is Route & { id: number } => r.id != null)
    .map(r => store.profileOf(r))
)

async function reload() {
  await store.load(true)
  await nextTick()
  renderScatter()
}

function renderScatter() {
  const data = profiles.value.map(p => ({
    value: [p.stats.declaredDistanceNm ?? p.stats.geoDistanceNm, p.stats.totalPoints],
    name: p.route.routeName || `#${p.route.id}`,
  }))
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: {
      formatter: (p: unknown) => {
        const q = p as { data: { name: string; value: [number, number] } }
        return `${q.data.name}<br/>里程 ${q.data.value[0].toFixed(1)} nm<br/>点位 ${q.data.value[1]}`
      },
    },
    grid: { left: 10, right: 20, top: 16, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      name: 'nm',
      nameTextStyle: { color: '#7d93b8', fontSize: 10 },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    yAxis: {
      type: 'value',
      name: '点数',
      nameTextStyle: { color: '#7d93b8', fontSize: 10 },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: 11,
        data,
        itemStyle: { color: 'rgba(56,189,248,0.8)', borderColor: '#7dd3fc', borderWidth: 1 },
        emphasis: { scale: 1.4 },
      },
    ],
  })
}

onMounted(async () => {
  await store.load()
  await nextTick()
  renderScatter()
})
</script>

<style scoped>
.rst-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  align-items: start;
}
.sc-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 14px 16px 0;
}
.sc-chart {
  height: 420px;
  padding: 6px 12px 14px;
}
@media (max-width: 1100px) {
  .rst-grid { grid-template-columns: 1fr; }
}
</style>
