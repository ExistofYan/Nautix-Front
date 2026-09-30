<template>
  <div class="sensor-detail">
    <div class="sd-head nx-panel">
      <div class="sd-icon"><el-icon :size="22"><Odometer /></el-icon></div>
      <div class="sd-titles">
        <h3>{{ cfg ? sensorStore.nameOf(cfg.id) : `传感器 #${configId}` }}</h3>
        <p>
          <span v-if="shipName">{{ shipName }}</span>
          <el-divider v-if="shipName && typeName" direction="vertical" />
          <span v-if="typeName">{{ typeName }}</span>
          <template v-if="cfg?.installDate"> · 安装于 {{ cfg.installDate }}</template>
        </p>
      </div>
      <SensorStatus v-if="cfg" :status="cfg.status" :last-recorded-at="lastRecordedAt" />
    </div>

    <div class="sd-kpis">
      <KPICard label="均值" :value="stat.mean" :unit="unit" :precision="2" icon="DataLine" />
      <KPICard label="最大值" :value="stat.max" :unit="unit" :precision="2" trend="up" icon="Top" />
      <KPICard label="最小值" :value="stat.min" :unit="unit" :precision="2" trend="down" icon="Bottom" />
      <KPICard label="标准差" :value="stat.stdDev" :unit="unit" :precision="3" icon="Histogram" />
    </div>

    <SensorChart
      :title="`近 ${points.length} 条读数趋势`"
      :unit="unit"
      :data="points"
      height="300px"
    >
      <template #extra>
        <el-tag size="small" type="info" effect="plain">{{ stat.count }} 样本</el-tag>
      </template>
    </SensorChart>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'
import SensorChart from '@/components/SensorChart.vue'
import SensorStatus from '@/components/sensor/SensorStatus.vue'
import KPICard from '@/components/common/KPICard.vue'
import type { AggStat } from '@/types/sensor'

const props = defineProps<{ configId: number }>()

const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()

const cfg = computed(() => sensorStore.configOf(props.configId))
const unit = computed(() => (cfg.value ? sensorStore.unitOf(cfg.value.typeId) : ''))
const typeName = computed(() => (cfg.value ? sensorStore.typeNameOf(cfg.value.typeId) : undefined))
const shipName = computed(() =>
  cfg.value?.shipId != null ? shipStore.shipMap.get(cfg.value.shipId)?.shipName : undefined,
)

const points = computed(() => dataStore.pointsOf(props.configId))

const lastRecordedAt = computed(() => {
  const s = dataStore.seriesByConfig.get(props.configId)
  return s?.length ? s[s.length - 1].recordedAt ?? null : null
})

const EMPTY_STAT: AggStat = { count: 0, mean: null, max: null, min: null, stdDev: null }

const stat = computed<AggStat>(() => {
  const vs = points.value.map(p => p.v).filter((v): v is number => Number.isFinite(v))
  if (!vs.length) return EMPTY_STAT
  const sum = vs.reduce((a, b) => a + b, 0)
  const mean = sum / vs.length
  const variance = vs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vs.length
  return {
    count: vs.length,
    mean,
    max: Math.max(...vs),
    min: Math.min(...vs),
    stdDev: Math.sqrt(variance),
  }
})
</script>

<style scoped>
.sensor-detail { display: flex; flex-direction: column; gap: 14px; }
.sd-head { display: flex; align-items: center; gap: 14px; padding: 16px 18px; }
.sd-icon {
  width: 46px; height: 46px; border-radius: 13px; flex: none; display: flex; align-items: center; justify-content: center;
  color: #7dd3fc; background: linear-gradient(135deg, rgba(56,189,248,.25), rgba(124,58,237,.25));
  border: 1px solid rgba(125,211,252,.28);
}
.sd-titles { flex: 1; min-width: 0; }
.sd-titles h3 { margin: 0; font-size: 17px; color: #e2e8f0; }
.sd-titles p { margin: 3px 0 0; font-size: 12px; color: var(--nx-text-dim); }
.sd-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
</style>
