<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">异常传感器榜</h2>
        <p class="nx-page-desc">基于 volatility 统计的波动排行（口径：最近 {{ scanLabel }} 样本窗口）</p>
      </div>
      <el-button round :loading="loading" @click="reload">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <div class="na-note nx-panel">
      <el-icon color="#fbbf24"><Warning /></el-icon>
      <span>判定规则：标准差 &gt; |均值| × 5%（离散系数 CV &gt; 0.05）标记为波动异常，通常意味着传感器漂移、安装松动或采样干扰。该榜单只反映统计离散度，不等同于设备故障。</span>
    </div>

    <div class="na-cards">
      <KPICard label="参与统计传感器" :value="rows.length" icon="Odometer" />
      <KPICard label="波动异常数" :value="abnormalCount" icon="Warning" trend="up" />
      <KPICard label="最大标准差" :value="maxStd" :precision="3" icon="Histogram" />
    </div>

    <div class="nx-panel na-table">
      <el-table v-loading="loading" :data="rows" stripe height="calc(100vh - 460px)">
        <el-table-column type="index" label="#" width="55" />
        <el-table-column prop="sensorName" label="传感器" min-width="180" show-overflow-tooltip />
        <el-table-column prop="shipName" label="所属船舶" width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.shipName ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="cnt" label="样本数" width="90" align="right" />
        <el-table-column label="均值" width="120" align="right">
          <template #default="{ row }"><MetricValue :value="row.mean" :unit="row.unit" :precision="2" /></template>
        </el-table-column>
        <el-table-column label="标准差" width="110" align="right">
          <template #default="{ row }">
            <span :class="{ abnormal: row.abnormal }">{{ fmt(row.stdDev, 3) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="离散系数" width="110" align="right">
          <template #default="{ row }">{{ row.cv == null ? '—' : (row.cv * 100).toFixed(1) + '%' }}</template>
        </el-table-column>
        <el-table-column label="判定" width="110">
          <template #default="{ row }">
            <StatusBadge :status="row.abnormal ? 'danger' : 'normal'" :label="row.abnormal ? '波动异常' : '稳定'" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !rows.length" :image-size="70" description="暂无 volatility 数据，请确认后端服务在线" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'
import KPICard from '@/components/common/KPICard.vue'
import MetricValue from '@/components/common/MetricValue.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()

const loading = ref(false)
const rows = computed(() => dataStore.anomalyRows)
const abnormalCount = computed(() => rows.value.filter(r => r.abnormal).length)
const maxStd = computed(() => (rows.value.length ? Math.max(...rows.value.map(r => r.stdDev ?? -Infinity)) : null))
const scanLabel = computed(() => '30 万')

function fmt(v: number | null | undefined, d = 2): string {
  return v == null || !Number.isFinite(v) ? '—' : v.toFixed(d)
}

async function reload() {
  loading.value = true
  try {
    await Promise.all([sensorStore.load(true), shipStore.loadShips(), dataStore.loadVolatility()])
  } finally {
    loading.value = false
  }
}

onMounted(() => { void reload() })
</script>

<style scoped>
.na-note {
  display: flex; gap: 10px; align-items: flex-start; padding: 12px 16px;
  font-size: 12.5px; color: var(--nx-text-dim); line-height: 1.6;
}
.na-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.na-table { padding: 10px 14px 14px; }
.abnormal { color: #fb7185; font-weight: 700; }
</style>
