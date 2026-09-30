<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">历史数据查询</h2>
        <p class="nx-page-desc">按船舶与时间范围检索传感器读数，支持导出 CSV · 已接入传感器 {{ sensorCount }} 台</p>
      </div>
      <el-button type="primary" round :disabled="!rows.length" @click="exportCsv">
        <el-icon><Download /></el-icon>导出 CSV
      </el-button>
    </div>

    <div class="nx-panel sh-filter">
      <el-select-v2 v-model="shipId" :options="shipOptions" placeholder="全部船舶" clearable filterable style="width: 220px" @change="reload" />
      <el-date-picker
        v-model="timeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        @change="reload"
      />
      <el-select v-model="size" style="width: 130px" @change="reload">
        <el-option label="每页 20" :value="20" />
        <el-option label="每页 50" :value="50" />
        <el-option label="每页 100" :value="100" />
      </el-select>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>查询</el-button>
      <span class="sh-count">共 {{ total }} 条</span>
    </div>

    <div class="sh-charts">
      <div class="nx-panel sh-chart">
        <SensorChart title="当前页读数预览（按时间升序）" :data="previewPoints" height="220px" color="#a78bfa" />
      </div>
      <div class="nx-panel sh-chart">
        <LineChart title="按传感器分组对比" :labels="groupLabels" :series="groupSeries" height="220px" y-axis-name="读数" />
      </div>
    </div>

    <div class="nx-panel sh-table">
      <el-table v-loading="loading" :data="rows" stripe height="calc(100vh - 520px)">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column label="船舶" width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ shipNameOf(row.shipId) }}</template>
        </el-table-column>
        <el-table-column label="传感器" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">{{ sensorStore.nameOf(row.configId) }}</template>
        </el-table-column>
        <el-table-column label="读数" width="140" align="right">
          <template #default="{ row }">
            <SensorValue :value="row.dataValue ?? null" :unit="unitOfConfig(row.configId)" :precision="3" />
          </template>
        </el-table-column>
        <el-table-column prop="recordedAt" label="记录时间" min-width="170" />
      </el-table>

      <div class="sh-pager">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="size"
          layout="total, prev, pager, next"
          @current-change="reload"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSensorDataPage } from '@/api/sensor'
import type { SensorData } from '@/api/types'
import { useSensorStore } from '@/stores/sensor'
import { useSensor } from '@/hooks/useSensor'
import { useShipStore } from '@/stores/shipStore'
import SensorChart from '@/components/SensorChart.vue'
import LineChart from '@/components/chart/LineChart.vue'
import SensorValue from '@/components/sensor/SensorValue.vue'
import type { SensorPoint } from '@/types/sensor'
import type { Series } from '@/types/chart'
import { paletteAt } from '@/types/chart'

const sensorStore = useSensorStore()
const { sensorCount } = useSensor()
const shipStore = useShipStore()

const loading = ref(false)
const rows = ref<SensorData[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(50)
const shipId = ref<number>()
const timeRange = ref<[string, string] | null>(null)

const shipOptions = computed(() =>
  shipStore.ships.map(s => ({ value: s.id as number, label: `${s.shipName} (${s.id})` })),
)

function shipNameOf(id?: number): string {
  if (id == null) return '—'
  return shipStore.shipMap.get(id)?.shipName || `#${id}`
}

function unitOfConfig(configId?: number): string {
  const c = configId != null ? sensorStore.configOf(configId) : undefined
  return c ? sensorStore.unitOf(c.typeId) : ''
}

/** 当前页读数按时间升序合成迷你趋势线 */
const previewPoints = computed<SensorPoint[]>(() =>
  [...rows.value]
    .sort((a, b) => (a.recordedAt || '').localeCompare(b.recordedAt || ''))
    .map(r => ({ t: (r.recordedAt || '').slice(5, 19), v: r.dataValue ?? 0 })),
)

/** 按 configId 分组的多传感器对比（最多 6 条，缺测点 null 断线） */
const groupLabels = computed(() =>
  [...new Set(previewPoints.value.map(p => p.t))].sort(),
)
const groupSeries = computed<Series[]>(() => {
  const byCfg = new Map<number, Map<string, number>>()
  for (const r of rows.value) {
    if (r.configId == null) continue
    const m = byCfg.get(r.configId) ?? new Map<string, number>()
    m.set((r.recordedAt || '').slice(5, 19), r.dataValue ?? 0)
    byCfg.set(r.configId, m)
  }
  return [...byCfg.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 6)
    .map(([cfgId, m], i) => ({
      name: sensorStore.nameOf(cfgId),
      color: paletteAt(i),
      data: groupLabels.value.map(t => m.get(t) ?? null),
    }))
})

async function reload() {
  loading.value = true
  try {
    const res = await getSensorDataPage({
      page: page.value,
      size: size.value,
      shipId: shipId.value,
      startTime: timeRange.value?.[0],
      endTime: timeRange.value?.[1],
    })
    rows.value = res?.records || []
    total.value = res?.total || 0
  } catch {
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  const head = ['id', 'shipId', 'shipName', 'configId', 'sensorName', 'dataValue', 'unit', 'recordedAt']
  const lines = rows.value.map(r => [
    r.id ?? '', r.shipId ?? '', csvSafe(shipNameOf(r.shipId)), r.configId ?? '',
    csvSafe(sensorStore.nameOf(r.configId)), r.dataValue ?? '', csvSafe(unitOfConfig(r.configId)),
    csvSafe(r.recordedAt ?? ''),
  ].join(','))
  const csv = '\uFEFF' + [head.join(','), ...lines].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `sensor-history-p${page.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.value.length} 条`)
}

function csvSafe(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

onMounted(async () => {
  await Promise.all([shipStore.loadShips(), sensorStore.load()])
  reload()
})
</script>

<style scoped>
.sh-filter { display: flex; gap: 12px; padding: 14px 16px; flex-wrap: wrap; align-items: center; }
.sh-count { margin-left: auto; font-size: 12px; color: #64748b; }
.sh-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; }
.sh-chart { padding: 12px 14px; }
.sh-chart :deep(.sensor-chart) { border: none; background: transparent; padding: 0; }
.sh-table { padding: 10px 14px 14px; }
.sh-pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
