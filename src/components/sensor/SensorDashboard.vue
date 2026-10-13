<template>
  <div class="sensor-dashboard">
    <div class="sd-cards">
      <KPICard label="传感器总数" :value="total" icon="Odometer" :description="shipId != null ? '该船安装配置' : '全站限量抽样'" />
      <KPICard label="在线传感器" :value="online" icon="Link" trend="up" :description="`占比 ${total ? Math.round((online / total) * 100) : 0}%`" />
      <KPICard label="波动最大" :value="topName" icon="Warning" :description="topDesc" />
    </div>

    <div class="nx-panel sd-chart-card">
      <div class="card-title"><el-icon><Histogram /></el-icon>波动率排行（标准差 Top 6）</div>
      <el-empty v-if="!barData.length" :image-size="70" description="暂无 volatility 数据">
        <template #image><el-icon :size="56" color="#9ca3af"><DataLine /></el-icon></template>
      </el-empty>
      <div v-else ref="chartEl" class="chart-box" />
    </div>

    <div class="nx-panel sd-list">
      <div class="card-title"><el-icon><Grid /></el-icon>传感器读数速览<span v-if="shipId != null" class="sd-sub"> · {{ shipName }}</span></div>
      <el-table v-loading="loading" :data="rows" stripe height="320">
        <el-table-column prop="name" label="传感器" min-width="160" show-overflow-tooltip />
        <el-table-column prop="shipName" label="所属船舶" width="150" show-overflow-tooltip />
        <el-table-column prop="typeName" label="类型" width="130" />
        <el-table-column label="最新读数" width="140" align="right">
          <template #default="{ row }">
            <SensorValue :value="row.latest" :unit="row.unit" />
          </template>
        </el-table-column>
        <el-table-column prop="time" label="采样时间" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><StatusBadge :status="row.status === 1 ? 'normal' : 'offline'" /></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'
import { getSensorConfigCount } from '@/api/sensor'
import KPICard from '@/components/common/KPICard.vue'
import SensorValue from '@/components/sensor/SensorValue.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

/**
 * 传入 shipId 时按船展示（该船 16 个传感器 + 该船波动率）；
 * 不传则为全站概览——注意全站配置有 16 万条，列表接口已限量，
 * 故总数走 /sensorConfig/count，不再用抽样长度冒充。
 */
const props = defineProps<{ shipId?: number }>()

const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()

const loading = computed(() => sensorStore.loading || dataStore.volLoading)

const totalCount = ref<number | null>(null)
const onlineCount = ref<number | null>(null)

const shipConfigs = computed(() => (props.shipId != null ? sensorStore.configsOfShip(props.shipId) : []))

/** 按船时用真实总数；全站时用 count 端点 */
const total = computed(() =>
  props.shipId != null ? shipConfigs.value.length : (totalCount.value ?? sensorStore.configs.length),
)
const online = computed(() =>
  props.shipId != null
    ? shipConfigs.value.filter(c => c.status === 1).length
    : (onlineCount.value ?? sensorStore.configs.filter(c => c.status === 1).length),
)

const shipName = computed(() =>
  props.shipId != null ? shipStore.shipMap.get(props.shipId)?.shipName || `#${props.shipId}` : '',
)

/** stdDev 最高的 config → 名称 + 描述 */
const topAnomaly = computed(() => dataStore.anomalyRows[0])
const topName = computed(() => topAnomaly.value?.sensorName ?? '—')
const topDesc = computed(() =>
  topAnomaly.value && topAnomaly.value.stdDev != null
    ? `stdDev ${topAnomaly.value.stdDev.toFixed(2)}${topAnomaly.value.unit ? ' ' + topAnomaly.value.unit : ''}`
    : '无 volatility 统计',
)

const barData = computed(() =>
  [...dataStore.anomalyRows]
    .filter(r => r.stdDev != null)
    .sort((a, b) => (b.stdDev ?? 0) - (a.stdDev ?? 0))
    .slice(0, 6),
)

interface QuickRow {
  id: number
  name: string
  shipName?: string
  typeName?: string
  unit: string
  latest: number | null
  time: string
  status?: number
}

/** 按船时展示该船全部传感器；全站时只展示限量抽样的前 80 条 */
const rows = computed<QuickRow[]>(() => {
  const list = props.shipId != null ? shipConfigs.value : sensorStore.configs.slice(0, 80)
  return list.map(c => {
    const pts = c.id != null ? dataStore.pointsOf(c.id) : []
    const last = pts[pts.length - 1]
    return {
      id: c.id ?? -1,
      name: sensorStore.nameOf(c.id),
      shipName: c.shipId != null ? shipStore.shipMap.get(c.shipId)?.shipName : undefined,
      typeName: sensorStore.typeNameOf(c.typeId),
      unit: sensorStore.unitOf(c.typeId),
      latest: last ? last.v : null,
      time: last ? last.t.slice(11, 19) : '',
      status: c.status,
    }
  })
})

const chartEl = ref<HTMLElement>()
const { setOption } = useChart(chartEl)

function renderBar() {
  const d = barData.value
  if (!d.length) return
  setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 150, right: 30, top: 10, bottom: 28 },
    xAxis: { type: 'value', axisLabel: { color: chartTheme.legendText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
    yAxis: {
      type: 'category',
      data: d.map(r => r.sensorName ?? '').reverse(),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.legendText, fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: d.map(r => Number((r.stdDev ?? 0).toFixed(3))).reverse(),
      barWidth: 14,
      itemStyle: { borderRadius: [0, 7, 7, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [
        { offset: 0, color: '#1d4ed8' }, { offset: 1, color: '#38bdf8' }] } },
    }],
  })
}

async function loadAll() {
  const sid = props.shipId
  await Promise.all([
    sensorStore.load(),
    shipStore.loadShips(),
    sensorStore.ensureShipConfigs(sid),
    dataStore.loadVolatility(sid != null ? 5000 : 200000, sid),
    sid != null ? Promise.resolve() : loadCounts(),
  ])
  renderBar()
}

/** 全站总数/在线数走 count 端点，避免拉 16 万条配置 */
async function loadCounts() {
  try {
    const [all, on] = await Promise.all([getSensorConfigCount(), getSensorConfigCount(undefined, 1)])
    totalCount.value = typeof all === 'number' ? all : null
    onlineCount.value = typeof on === 'number' ? on : null
  } catch {
    totalCount.value = null
    onlineCount.value = null
  }
}

watch(() => props.shipId, () => { void loadAll() })

onMounted(() => { void loadAll() })
</script>

<style scoped>
.sensor-dashboard { display: flex; flex-direction: column; gap: 14px; }
.sd-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600;
  color: #b8d4f5; margin-bottom: 10px;
}
.sd-sub { font-weight: 400; color: var(--nx-text-dim); font-size: 12px; }
.sd-chart-card, .sd-list { padding: 14px 16px; }
.chart-box { height: 240px; }
</style>
