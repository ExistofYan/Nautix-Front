<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">单船传感器分析</h2>
        <p class="nx-page-desc">趋势、异常波动与统计摘要三视图</p>
      </div>
      <el-select-v2 v-model="shipId" :options="shipOptions" placeholder="选择船舶" filterable style="width: 240px" @change="onShipChange" />
    </div>

    <el-empty v-if="!shipId" description="请先在右上角选择一艘船" />

    <el-tabs v-else v-model="tab" class="sa-tabs nx-panel">
      <el-tab-pane label="趋势" name="trend">
        <div class="sa-trend-grid">
          <EngineChart :ship-id="shipId" />
          <FuelChart :ship-id="shipId" />
          <RPMChart :ship-id="shipId" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="异常榜" name="anomaly">
        <el-table v-loading="loadingVol" :data="shipRows" stripe>
          <el-table-column prop="sensorName" label="传感器" min-width="170" show-overflow-tooltip />
          <el-table-column prop="cnt" label="样本数" width="90" align="right" />
          <el-table-column label="均值" width="110" align="right">
            <template #default="{ row }"><MetricValue :value="row.mean" :unit="row.unit" /></template>
          </el-table-column>
          <el-table-column label="标准差" width="110" align="right">
            <template #default="{ row }">
              <span :class="{ abnormal: row.abnormal }">{{ fmt(row.stdDev, 3) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="离散系数" width="110" align="right">
            <template #default="{ row }">{{ row.cv == null ? '—' : (row.cv * 100).toFixed(1) + '%' }}</template>
          </el-table-column>
          <el-table-column label="判定" width="100">
            <template #default="{ row }">
              <StatusBadge :status="row.abnormal ? 'warning' : 'normal'" :label="row.abnormal ? '波动异常' : '稳定'" />
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loadingVol && !shipRows.length" :image-size="60" description="该船暂无 volatility 统计" />
      </el-tab-pane>

      <el-tab-pane label="统计摘要" name="summary">
        <div class="sa-cards">
          <KPICard label="配置传感器" :value="shipConfigs.length" icon="Odometer" />
          <KPICard label="在线传感器" :value="shipConfigs.filter(c => c.status === 1).length" trend="up" icon="Link" />
          <KPICard label="读数样本（trend 窗口）" :value="sampleCount" icon="Files" />
          <KPICard label="波动异常数" :value="shipRows.filter(r => r.abnormal).length" icon="Warning" />
        </div>
        <div class="nx-panel sa-list">
          <div class="card-title"><el-icon><Grid /></el-icon>传感器清单</div>
          <el-table :data="shipConfigs" stripe max-height="360">
            <el-table-column prop="sensorName" label="名称" min-width="160" />
            <el-table-column label="类型" width="140">
              <template #default="{ row }">{{ sensorStore.typeNameOf(row.typeId) ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="单位" width="90">
              <template #default="{ row }">{{ sensorStore.unitOf(row.typeId) || '—' }}</template>
            </el-table-column>
            <el-table-column label="最新值" width="130" align="right">
              <template #default="{ row }">
                <SensorValue :value="latestOf(row.id)" :unit="sensorStore.unitOf(row.typeId)" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><StatusBadge :status="row.status === 1 ? 'normal' : 'offline'" :label="row.status === 1 ? '在线' : '停用'" /></template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'
import EngineChart from '@/components/sensor/EngineChart.vue'
import FuelChart from '@/components/sensor/FuelChart.vue'
import RPMChart from '@/components/sensor/RPMChart.vue'
import KPICard from '@/components/common/KPICard.vue'
import MetricValue from '@/components/common/MetricValue.vue'
import SensorValue from '@/components/sensor/SensorValue.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()

const shipId = ref<number>()
const tab = ref('trend')
const loadingVol = ref(false)

const shipOptions = computed(() =>
  shipStore.ships.map(s => ({ value: s.id as number, label: `${s.shipName} (${s.id})` })),
)

const shipConfigs = computed(() => sensorStore.configsOfShip(shipId.value))

const shipRows = computed(() => dataStore.anomalyRows.filter(r => shipId.value != null && r.shipId === shipId.value))

const sampleCount = computed(() =>
  shipConfigs.value.reduce((n, c) => n + (c.id != null ? dataStore.seriesByConfig.get(c.id)?.length ?? 0 : 0), 0),
)

function latestOf(id?: number): number | null {
  if (id == null) return null
  const p = dataStore.pointsOf(id)
  return p.length ? p[p.length - 1].v : null
}

function fmt(v: number | null | undefined, d = 2): string {
  return v == null || !Number.isFinite(v) ? '—' : v.toFixed(d)
}

async function onShipChange() {
  loadingVol.value = true
  try {
    await Promise.all([dataStore.loadTrend(400), dataStore.loadVolatility()])
  } finally {
    loadingVol.value = false
  }
}

onMounted(async () => {
  await Promise.all([shipStore.loadShips(), sensorStore.load()])
})
</script>

<style scoped>
.sa-tabs { padding: 8px 16px 16px; }
.sa-trend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }
.sa-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px; }
.sa-list { padding: 14px 16px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #b8d4f5; margin-bottom: 10px; }
.abnormal { color: #fb7185; font-weight: 700; }
</style>
