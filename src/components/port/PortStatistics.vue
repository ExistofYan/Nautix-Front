<template>
  <div class="nx-panel stats-card">
    <div class="head">
      <span class="title"><el-icon><PieChart /></el-icon> 港口分布统计</span>
      <span class="meta">{{ ports.length }} 个港口 · {{ clusters.length }} 个国家/地区</span>
    </div>

    <el-skeleton v-if="loading" :rows="4" animated />
    <template v-else-if="ports.length">
      <div ref="chartEl" class="chart" />
      <el-table :data="clusters" size="small" max-height="260" stripe>
        <el-table-column prop="country" label="国家/地区" min-width="130" show-overflow-tooltip />
        <el-table-column prop="countryCode" label="代码" width="80" />
        <el-table-column label="港口数" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" round>{{ row.count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="代表港" min-width="150">
          <template #default="{ row }">{{ row.ports[0]?.portName || '—' }}</template>
        </el-table-column>
      </el-table>
      <div class="ps-scatter">
        <div class="ps-scatter-title">港口分布（SVG 投影）</div>
        <svg viewBox="0 0 1000 600" class="ps-scatter-svg">
          <rect width="1000" height="600" fill="#081426" rx="12" />
          <g stroke="rgba(56,189,248,0.10)" stroke-width="0.6">
            <line v-for="i in 10" :key="'v'+i" :x1="(i-1)*100" y1="0" :x2="(i-1)*100" y2="600" />
            <line v-for="i in 6" :key="'h'+i" x1="0" :y1="(i-1)*120" x2="1000" :y2="(i-1)*120" />
          </g>
          <PortMarker
            v-for="p in ports.filter(x => x.longitude != null && x.latitude != null)"
            :key="p.id"
            :port="p"
            :x="projX(p.longitude)"
            :y="projY(p.latitude)"
            :size="7"
            :show-label="ports.length <= 40"
          />
        </svg>
      </div>
    </template>
    <el-empty v-else description="暂无港口数据" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePortStore } from '@/stores/port'
import PortMarker from '@/components/port/PortMarker.vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { PortCluster } from '@/types/port'

const store = usePortStore()
const loading = ref(true)
const chartEl = ref<HTMLElement>()
const { setOption } = useChart(chartEl)

const ports = computed(() => store.ports)

/** 散点投影：经度 -180..180 → 0..1000，纬度 84..-72 → 0..600 */
function projX(lon?: number | null): number {
  return lon == null ? -999 : ((lon + 180) / 360) * 1000
}
function projY(lat?: number | null): number {
  return lat == null ? -999 : ((84 - lat) / 156) * 600
}

const clusters = computed<PortCluster[]>(() => {
  const m = new Map<string, PortCluster>()
  for (const p of ports.value) {
    const key = p.country || '未知'
    const c = m.get(key) ?? { country: key, countryCode: p.countryCode || '', count: 0, ports: [] }
    c.count++
    c.ports.push(p)
    if (!c.countryCode && p.countryCode) c.countryCode = p.countryCode
    m.set(key, c)
  }
  return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 12)
})

function render() {
  if (!clusters.value.length) return
  setOption({
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 30, top: 10, bottom: 10, containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    yAxis: {
      type: 'category',
      data: clusters.value.map(c => c.country).reverse(),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color, width: 90, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      data: clusters.value.map(c => c.count).reverse(),
      barWidth: 12,
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: '#38bdf8' }, { offset: 1, color: '#a78bfa' }],
        },
      },
      label: { show: true, position: 'right', color: '#94a3b8', fontSize: 10 },
    }],
  })
}

onMounted(async () => {
  await store.load()
  loading.value = false
  render()
})
watch(clusters, render)
</script>

<style scoped>
.stats-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.meta { font-size: 11.5px; color: #64748b; }
.chart { height: 300px; margin-bottom: 10px; }
.ps-scatter { margin-top: 14px; }
.ps-scatter-title { font-size: 12.5px; color: var(--nx-text-dim, #a8bdd9); margin-bottom: 6px; }
.ps-scatter-svg { width: 100%; height: auto; display: block; border-radius: 12px; }
</style>
