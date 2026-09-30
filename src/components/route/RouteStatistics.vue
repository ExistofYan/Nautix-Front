<template>
  <div class="route-stats nx-panel">
    <div class="rs-title"><el-icon><Histogram /></el-icon><span>航线里程统计</span></div>

    <div ref="histEl" class="rs-chart"></div>

    <div v-if="profiles.length" class="rs-table">
      <div class="rs-sub">最长航线 Top {{ Math.min(10, profiles.length) }}</div>
      <el-table :data="topRows" stripe size="small" max-height="300">
        <el-table-column type="index" label="#" width="46" />
        <el-table-column prop="name" label="航线" min-width="170" show-overflow-tooltip />
        <el-table-column label="里程 (nm)" width="120" sortable :sort-by="'distanceNm'">
          <template #default="{ row }"><b class="dist">{{ fmt(row.distanceNm) }}</b></template>
        </el-table-column>
        <el-table-column prop="pointCount" label="点数" width="80" sortable />
        <el-table-column label="估算时长" width="110">
          <template #default="{ row }">{{ fmt(row.durationHours) }} h</template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="暂无航线数据" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { RouteProfile } from '@/types/route'

const props = defineProps<{ profiles: RouteProfile[] }>()

const histEl = ref<HTMLElement>()
const { setOption } = useChart(histEl)

const topRows = computed(() =>
  [...props.profiles]
    .map(p => ({
      name: p.route.routeName || `#${p.route.id}`,
      distanceNm: p.stats.declaredDistanceNm ?? p.stats.geoDistanceNm,
      pointCount: p.stats.totalPoints,
      durationHours: p.stats.durationHoursEst,
    }))
    .sort((a, b) => b.distanceNm - a.distanceNm)
    .slice(0, 10)
)

/** 里程直方分桶 */
const buckets = computed(() => {
  const edges = [0, 50, 100, 200, 400, 800, 1500, 3000, Infinity]
  const labels = ['<50', '50-100', '100-200', '200-400', '400-800', '800-1500', '1500-3000', '≥3000']
  const counts = new Array(labels.length).fill(0)
  for (const p of props.profiles) {
    const d = p.stats.declaredDistanceNm ?? p.stats.geoDistanceNm
    if (!Number.isFinite(d)) continue
    const i = edges.findIndex((e, j) => d >= e && d < edges[j + 1])
    if (i >= 0) counts[i]++
  }
  return { labels, counts }
})

function render() {
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 14, top: 16, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: buckets.value.labels,
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { fontSize: 10, rotate: 28 },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.splitLine } } },
    series: [
      {
        type: 'bar',
        data: buckets.value.counts,
        barWidth: '52%',
        itemStyle: { borderRadius: [5, 5, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#38bdf8' }, { offset: 1, color: '#2563eb' }] } },
      },
    ],
  })
}

watch(() => props.profiles, async () => { await nextTick(); render() }, { immediate: false })
onMounted(async () => { await nextTick(); render() })

function fmt(v?: number | null, d = 1) {
  return v == null || Number.isNaN(v) ? '--' : v.toFixed(d)
}
</script>

<style scoped>
.route-stats {
  padding: 16px 18px;
}
.rs-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
}
.rs-chart {
  height: 240px;
  margin-top: 8px;
}
.rs-table {
  margin-top: 10px;
}
.rs-sub {
  font-size: 12.5px;
  color: var(--nx-text-dim);
  margin-bottom: 8px;
}
.dist {
  color: var(--nx-primary);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
</style>
