<template>
  <div class="nx-page ship-an">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Ship /></el-icon> 船舶分析</h2>
        <p class="nx-page-desc">口径：/shipInfo/page（全量拉取）+ /dashboard/ship-type-dist 前端派生分布</p>
      </div>
      <el-button round :loading="loading" @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <div class="kpi-row">
      <GlassPanel title="在管船舶" :icon="Ship"><div class="big-num">{{ ships.length }}</div></GlassPanel>
      <GlassPanel title="平均船龄（年）" :icon="Timer"><div class="big-num">{{ num(avgAge, 1) }}</div></GlassPanel>
      <GlassPanel title="平均船长（米）" :icon="ScaleToOriginal"><div class="big-num">{{ num(avgLen, 1) }}</div></GlassPanel>
      <GlassPanel title="登记港数" :icon="MapLocation"><div class="big-num">{{ registryCount }}</div></GlassPanel>
    </div>

    <div class="grid-2">
      <GlassPanel title="船型分布" :icon="PieChart">
        <div ref="pieEl" class="chart" />
        <div v-if="!loading && !ships.length" class="empty-mini">暂无船舶档案</div>
      </GlassPanel>
      <GlassPanel title="船龄分布" :icon="Histogram">
        <div ref="ageEl" class="chart" />
      </GlassPanel>
    </div>

    <div class="grid-2">
      <GlassPanel title="船长分布（米）" :icon="Histogram">
        <div ref="lenEl" class="chart" />
      </GlassPanel>
      <GlassPanel title="型宽分布（米）" :icon="Histogram">
        <div ref="beamEl" class="chart" />
      </GlassPanel>
    </div>

    <GlassPanel title="船型 × 登记港 明细" :icon="List">
      <el-table :data="tableRows" size="small" stripe max-height="420">
        <el-table-column prop="type" label="船型" min-width="140" show-overflow-tooltip />
        <el-table-column prop="registry" label="主要登记港" min-width="160" show-overflow-tooltip />
        <el-table-column prop="count" label="艘数" width="90" sortable />
        <el-table-column label="平均船龄" width="110">
          <template #default="{ row }">{{ num(row.avgAge, 1) }} 年</template>
        </el-table-column>
        <el-table-column label="平均船长" width="110">
          <template #default="{ row }">{{ num(row.avgLen, 1) }} m</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !tableRows.length" description="后端未启动或无数据" :image-size="70" />
    </GlassPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { List, Ship, Timer, ScaleToOriginal, MapLocation, PieChart, Histogram } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import { getShipPage } from '@/api/ship'
import { getShipTypeDistribution } from '@/api/dashboard'
import type { ShipInfo } from '@/api/types'
import { useChart, chartTheme } from '@/hooks/useChart'
import type * as echarts from 'echarts'

interface TypeRow {
  type: string
  registry: string
  count: number
  avgAge: number | null
  avgLen: number | null
}

const NOW_YEAR = new Date().getFullYear()

const ships = ref<ShipInfo[]>([])
const typeDist = ref<{ type: string; count: number }[]>([])
const loading = ref(false)

const pieEl = ref<HTMLElement>()
const ageEl = ref<HTMLElement>()
const lenEl = ref<HTMLElement>()
const beamEl = ref<HTMLElement>()
const pie = useChart(pieEl)
const ageC = useChart(ageEl)
const lenC = useChart(lenEl)
const beamC = useChart(beamEl)

function num(v: number | null | undefined, d: number) { return v == null || Number.isNaN(v) ? '--' : v.toFixed(d) }
function ages(): number[] {
  return ships.value
    .map(s => (s.buildYear != null ? NOW_YEAR - s.buildYear : null))
    .filter((n): n is number => n != null && n >= 0 && n < 100)
}
function nums(key: 'lengthOverall' | 'beam'): number[] {
  return ships.value.map(s => s[key]).filter((n): n is number => typeof n === 'number' && n > 0)
}

const avgAge = computed(() => { const a = ages(); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null })
const avgLen = computed(() => { const a = nums('lengthOverall'); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null })
const registryCount = computed(() => new Set(ships.value.map(s => s.registryPort).filter(Boolean)).size)

const tableRows = computed<TypeRow[]>(() => {
  const g = new Map<string, ShipInfo[]>()
  for (const s of ships.value) {
    const key = `${s.shipType || '未知'}|${s.registryPort || '未知'}`
    const arr = g.get(key) ?? []
    arr.push(s)
    g.set(key, arr)
  }
  return [...g.entries()]
    .map(([key, list]) => {
      const [type, registry] = key.split('|')
      const as = list.map(s => (s.buildYear != null ? NOW_YEAR - s.buildYear : null)).filter((n): n is number => n != null)
      const ls = list.map(s => s.lengthOverall).filter((n): n is number => typeof n === 'number')
      return {
        type, registry, count: list.length,
        avgAge: as.length ? as.reduce((a, b) => a + b, 0) / as.length : null,
        avgLen: ls.length ? ls.reduce((a, b) => a + b, 0) / ls.length : null,
      }
    })
    .sort((a, b) => b.count - a.count)
})

function histOption(values: number[], edges: number[], color: string): echarts.EChartsOption {
  const labels: string[] = []
  const data = new Array(Math.max(edges.length - 1, 0)).fill(0) as number[]
  for (let i = 0; i < edges.length - 1; i++) labels.push(`${Math.round(edges[i])}-${Math.round(edges[i + 1])}`)
  for (const v of values) {
    for (let i = 0; i < edges.length - 1; i++) {
      if (v >= edges[i] && (i === edges.length - 2 ? v <= edges[i + 1] : v < edges[i + 1])) { data[i]++; break }
    }
  }
  return {
    textStyle: { color: chartTheme.textStyle.color },
    grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category', data: labels,
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [{
      type: 'bar', data, barWidth: '55%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color }, { offset: 1, color: '#2563eb' }] } },
      label: { show: true, position: 'top', color: '#94a3b8' },
    }],
  }
}

function render() {
  const dist = typeDist.value.length
    ? typeDist.value.map(d => ({ name: d.type || '未知', value: d.count }))
    : [...new Map(ships.value.map(s => [s.shipType || '未知', 0])).entries()].map(([name]) => ({
        name, value: ships.value.filter(s => (s.shipType || '未知') === name).length,
      }))
  if (dist.length) {
    pie.setOption({
      textStyle: { color: chartTheme.textStyle.color },
      tooltip: { trigger: 'item', formatter: '{b}: {c} 艘 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: chartTheme.legendText } },
      series: [{
        type: 'pie', radius: ['42%', '68%'], center: ['50%', '45%'],
        itemStyle: { borderColor: '#0a1428', borderWidth: 2 },
        label: { color: chartTheme.textStyle.color },
        data: dist,
      }],
    })
  }
  ageC.setOption(histOption(ages(), [0, 5, 10, 15, 20, 30, 100], '#38bdf8'))
  lenC.setOption(histOption(nums('lengthOverall'), [0, 50, 80, 120, 180, 250, 1000], '#a78bfa'))
  beamC.setOption(histOption(nums('beam'), [0, 10, 15, 22, 32, 45, 200], '#34d399'))
}

async function load() {
  loading.value = true
  try {
    const [pageRes, distRes] = await Promise.all([
      getShipPage({ page: 1, count: 100 }).catch(() => null),
      getShipTypeDistribution().catch(() => [] as { type: string; count: number }[]),
    ])
    ships.value = pageRes?.records ?? []
    typeDist.value = Array.isArray(distRes) ? distRes : []
  } catch {
    ships.value = []
  } finally {
    loading.value = false
    render()
  }
}

onMounted(load)
</script>

<style scoped>
.ship-an { display: flex; flex-direction: column; gap: 18px; }
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; }
.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; }
.big-num { font-size: 32px; font-weight: 800; color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; }
.chart { height: 300px; }
.empty-mini { text-align: center; font-size: 12px; color: #64748b; padding: 12px 0; }
</style>
