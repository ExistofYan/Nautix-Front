<template>
  <div class="nx-page fuel-an">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Odometer /></el-icon> 燃油分析</h2>
        <p class="nx-page-desc">全船队燃油存量分布与低油量预警 · 口径：/runtime.fuelPercent</p>
      </div>
      <el-button round :loading="loading" @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <div class="kpis">
      <MiniPanel label="在报船舶" :value="stat.total" unit="艘" tone="cyan" />
      <MiniPanel label="低油量（<15%）" :value="stat.lowCount" unit="艘" :tone="stat.lowCount ? 'red' : 'green'" />
      <MiniPanel label="平均存量" :value="avgText" unit="%" tone="violet" />
    </div>

    <GlassPanel title="燃油存量直方" :icon="Histogram">
      <div ref="histEl" class="chart" />
      <div v-if="!loading && !stat.total" class="empty-mini">暂无实时数据</div>
    </GlassPanel>

    <GlassPanel title="低油量船舶清单" :icon="Warning">
      <el-table :data="lowShips" size="small" stripe max-height="380">
        <el-table-column label="船名" min-width="160">
          <template #default="{ row }">{{ shipName(row.shipId) }}</template>
        </el-table-column>
        <el-table-column prop="sailingStatus" label="状态" width="110" />
        <el-table-column label="燃油存量" width="200">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.fuelPercent)" :stroke-width="8" color="#fb7185" />
          </template>
        </el-table-column>
        <el-table-column label="航速" width="90">
          <template #default="{ row }">{{ fx(row.speed, 1) }} kn</template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="160">
          <template #default="{ row }">{{ fmtTime(row.lastUpdate) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !lowShips.length" description="没有低于 15% 燃油的船舶" :image-size="60" />
    </GlassPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Histogram, Warning } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import MiniPanel from '@/components/layout/MiniPanel.vue'
import { getFuelDistribution, type FuelStat } from '@/api/analytics'
import { getAllRuntimeStatus } from '@/api/ship'
import { getAllShips } from '@/api/ship'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'

const stat = ref<FuelStat>({ total: 0, lowCount: 0, buckets: [] })
const runtime = ref<ShipRuntimeStatus[]>([])
const ships = ref<ShipInfo[]>([])
const loading = ref(false)
const histEl = ref<HTMLElement>()
const { setOption } = useChart(histEl)

const shipMap = computed(() => new Map(ships.value.filter(s => s.id != null).map(s => [s.id as number, s])))
function shipName(id?: number) { return id != null ? shipMap.value.get(id)?.shipName || `船 #${id}` : '—' }

const avgText = computed(() => {
  const vals = runtime.value.map(r => r.fuelPercent).filter((n): n is number => typeof n === 'number')
  if (!vals.length) return '--'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})

const lowShips = computed(() =>
  runtime.value
    .filter(r => typeof r.fuelPercent === 'number' && (r.fuelPercent as number) < 15)
    .sort((a, b) => (a.fuelPercent ?? 0) - (b.fuelPercent ?? 0)),
)

function render() {
  if (!stat.value.buckets.length) return
  setOption({
    textStyle: { color: chartTheme.textStyle.color },
    grid: { left: 40, right: 16, top: 24, bottom: 30 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: stat.value.buckets.map(b => b.label),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color },
    },
    yAxis: {
      type: 'value',
      name: '艘',
      nameTextStyle: { color: chartTheme.textStyle.color },
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [{
      type: 'bar',
      data: stat.value.buckets.map(b => ({
        value: b.count,
        itemStyle: { color: b.key === 'b0' ? '#fb7185' : '#38bdf8', borderRadius: [6, 6, 0, 0] },
      })),
      barWidth: 34,
      label: { show: true, position: 'top', color: '#94a3b8' },
    }],
  })
}

async function load() {
  loading.value = true
  try { stat.value = await getFuelDistribution() } catch { /* keep */ }
  try { runtime.value = (await getAllRuntimeStatus()) ?? [] } catch { runtime.value = [] }
  try { ships.value = (await getAllShips()) ?? [] } catch { /* empty */ }
  loading.value = false
  render()
}

onMounted(load)

function clamp(v?: number) { return Math.max(0, Math.min(100, Math.round(v ?? 0))) }
function fx(v?: number, d = 1) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d) }
function fmtTime(t?: string) {
  if (!t) return '—'
  const dt = new Date(t)
  return Number.isNaN(dt.getTime()) ? t : dt.toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.fuel-an { display: flex; flex-direction: column; gap: 18px; }
.kpis { display: flex; gap: 14px; flex-wrap: wrap; }
.chart { height: 300px; }
.empty-mini { text-align: center; font-size: 12px; color: #64748b; padding: 12px 0; }
</style>
