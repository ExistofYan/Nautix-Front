<template>
  <div class="nx-page sensor-an">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Odometer /></el-icon> 传感器分析</h2>
        <p class="nx-page-desc">口径：/sensorData/volatility（近 {{ SCAN }} 条采样窗）+ /sensorConfig + /sensorDict/list 前端聚合</p>
      </div>
      <el-button round :loading="loading" @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <div class="kpi-row">
      <GlassPanel title="监测配置总数" :icon="Odometer">
        <div class="big-num">{{ configs.length }}</div>
      </GlassPanel>
      <GlassPanel title="纳入波动统计的传感器" :icon="Histogram">
        <div class="big-num">{{ stats.length }}</div>
      </GlassPanel>
      <GlassPanel title="高波动传感器（σ > 均值×5%）" :icon="Warning">
        <div class="big-num warn">{{ unstable.length }}</div>
      </GlassPanel>
    </div>

    <GlassPanel title="稳定性排行 Top 12（标准差降序）" :icon="Histogram">
      <div ref="barEl" class="chart" />
      <div v-if="!loading && !stats.length" class="empty-mini">暂无波动统计数据（后端未启动或采样窗内无数据）</div>
    </GlassPanel>

    <GlassPanel title="全量波动明细" :icon="List">
      <el-table :data="tableRows" size="small" stripe max-height="460">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="name" label="传感器" min-width="180" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="90" />
        <el-table-column prop="cnt" label="样本数" width="90" sortable />
        <el-table-column label="均值" width="110" sortable :sort-by="(r: TableRow) => r.mean ?? -1">
          <template #default="{ row }">{{ num(row.mean, 2) }}</template>
        </el-table-column>
        <el-table-column label="标准差 σ" width="110" sortable :sort-by="(r: TableRow) => r.stdDev ?? -1">
          <template #default="{ row }">{{ num(row.stdDev, 3) }}</template>
        </el-table-column>
        <el-table-column label="变异系数 CV" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.cv != null && row.cv > 0.05" type="danger" size="small" effect="dark">{{ pct(row.cv) }}</el-tag>
            <span v-else>{{ row.cv == null ? '--' : pct(row.cv) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !tableRows.length" description="后端未启动或暂无数据" :image-size="70" />
    </GlassPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { List, Odometer, Histogram, Warning } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import { getAllSensorConfigs, getAllSensorDicts, getSensorVolatility, type VolatilityStat } from '@/api/sensor'
import type { SensorConfig, SensorDict } from '@/api/types'
import { useChart, chartTheme } from '@/hooks/useChart'

const SCAN = 300000

interface TableRow extends VolatilityStat {
  name: string
  unit: string
  cv: number | null
}

const stats = ref<VolatilityStat[]>([])
const configs = ref<SensorConfig[]>([])
const dicts = ref<SensorDict[]>([])
const loading = ref(false)
const barEl = ref<HTMLElement>()
const { setOption } = useChart(barEl)

function num(v: number | null | undefined, d: number) { return v == null || Number.isNaN(v) ? '--' : v.toFixed(d) }
function pct(v: number | null) { return v == null ? '--' : (v * 100).toFixed(1) + '%' }

const configMap = computed(() => {
  const m = new Map<number, SensorConfig>()
  for (const c of configs.value) if (c.id != null) m.set(c.id, c)
  return m
})
const dictMap = computed(() => {
  const m = new Map<number, SensorDict>()
  for (const d of dicts.value) if (d.id != null) m.set(d.id, d)
  return m
})

const tableRows = computed<TableRow[]>(() =>
  [...stats.value]
    .sort((a, b) => (b.stdDev ?? -1) - (a.stdDev ?? -1))
    .map(s => {
      const cfg = configMap.value.get(s.configId)
      const dict = cfg?.typeId != null ? dictMap.value.get(cfg.typeId) : undefined
      const cv = s.stdDev != null && s.mean != null && Math.abs(s.mean) > 1e-9 ? s.stdDev / Math.abs(s.mean) : null
      return { ...s, name: cfg?.sensorName || `配置#${s.configId}`, unit: dict?.defaultUnit || '--', cv }
    }),
)

const unstable = computed(() => tableRows.value.filter(r => r.cv != null && r.cv > 0.05))

function render() {
  const top = tableRows.value.slice(0, 12).reverse()
  if (!top.length) return
  setOption({
    textStyle: { color: chartTheme.textStyle.color },
    grid: { left: 8, right: 50, top: 10, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    yAxis: {
      type: 'category',
      data: top.map(r => r.name),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color, width: 150, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      data: top.map(r => Number((r.stdDev ?? 0).toFixed(3))),
      barWidth: 14,
      itemStyle: {
        borderRadius: [0, 7, 7, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#f472b6' }] },
      },
      label: { show: true, position: 'right', color: '#94a3b8' },
    }],
  })
}

async function load() {
  loading.value = true
  try {
    const [vol, cfgs, ds] = await Promise.all([
      getSensorVolatility(SCAN).catch(() => [] as VolatilityStat[]),
      getAllSensorConfigs().catch(() => [] as SensorConfig[]),
      getAllSensorDicts().catch(() => [] as SensorDict[]),
    ])
    stats.value = Array.isArray(vol) ? vol : []
    configs.value = Array.isArray(cfgs) ? cfgs : []
    dicts.value = Array.isArray(ds) ? ds : []
  } catch {
    stats.value = []
  } finally {
    loading.value = false
    render()
  }
}

onMounted(load)
</script>

<style scoped>
.sensor-an { display: flex; flex-direction: column; gap: 18px; }
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
.big-num { font-size: 34px; font-weight: 800; color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; }
.big-num.warn { color: #fb7185; }
.chart { height: 340px; }
.empty-mini { text-align: center; font-size: 12px; color: #64748b; padding: 12px 0; }
</style>
