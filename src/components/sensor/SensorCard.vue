<template>
  <div class="sensor-card nx-panel" :class="{ selected }" @click="emit('select', config)">
    <div class="sc-head">
      <div class="sc-icon"><el-icon :size="18"><Odometer /></el-icon></div>
      <div class="sc-titles">
        <div class="sc-name">{{ config.sensorName || sensorStore.nameOf(config.id) }}</div>
        <div class="sc-sub">{{ shipLabel }} · {{ config.typeId != null ? sensorStore.typeNameOf(config.typeId) : '未知类型' }}</div>
      </div>
      <SensorStatus :status="config.status" :last-recorded-at="lastRecordedAt" />
    </div>

    <div v-if="latest != null" class="sc-latest">
      <span class="sc-val">{{ latest.toFixed(2) }}</span>
      <span class="sc-unit">{{ unit }}</span>
    </div>
    <div v-else class="sc-latest sc-empty">暂无读数</div>

    <div class="sc-spark" ref="sparkEl" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { SensorConfig } from '@/api/types'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'
import { useChart, chartTheme } from '@/hooks/useChart'
import SensorStatus from '@/components/sensor/SensorStatus.vue'

const props = withDefaults(
  defineProps<{ config: SensorConfig; selected?: boolean }>(),
  { selected: false },
)

const emit = defineEmits<{ (e: 'select', config: SensorConfig): void }>()

const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()

const unit = computed(() => sensorStore.unitOf(props.config.typeId))
const shipLabel = computed(() =>
  props.config.shipId != null ? shipStore.shipMap.get(props.config.shipId)?.shipName || `船 #${props.config.shipId}` : '未绑定船舶',
)

const points = computed(() => (props.config.id != null ? dataStore.pointsOf(props.config.id) : []))
const latest = computed(() => (points.value.length ? points.value[points.value.length - 1].v : null))
const lastRecordedAt = computed(() => {
  const s = props.config.id != null ? dataStore.seriesByConfig.get(props.config.id) : undefined
  return s?.length ? s[s.length - 1].recordedAt ?? null : null
})

const sparkEl = ref<HTMLElement>()
const { setOption } = useChart(sparkEl)

onMounted(() => {
  // 迷你 sparkline：最近 24 点，无坐标轴纯线形
  const renderSpark = () => {
    const d = points.value.slice(-24)
    if (!d.length) return
    setOption({
      grid: { left: 0, right: 0, top: 6, bottom: 0 },
      xAxis: { type: 'category', show: false, data: d.map(p => p.t) },
      yAxis: { type: 'value', show: false, scale: true },
      series: [{
        type: 'line', smooth: true, symbol: 'none',
        data: d.map(p => p.v),
        lineStyle: { width: 1.5, color: '#38bdf8' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(56,189,248,.25)' }, { offset: 1, color: 'rgba(56,189,248,0)' }] } },
      }],
      tooltip: { show: false },
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { color: chartTheme.legendText },
    })
  }
  renderSpark()
})
</script>

<style scoped>
.sensor-card { padding: 14px 16px; cursor: pointer; transition: transform .18s ease, border-color .18s ease; }
.sensor-card:hover { transform: translateY(-2px); }
.sensor-card.selected { border-color: rgba(56, 189, 248, .55); box-shadow: 0 0 0 1px rgba(125,211,252,.35) inset; }
.sc-head { display: flex; align-items: center; gap: 10px; }
.sc-icon {
  width: 34px; height: 34px; border-radius: 10px; flex: none; display: flex; align-items: center; justify-content: center;
  color: #7dd3fc; background: linear-gradient(135deg, rgba(56,189,248,.22), rgba(124,58,237,.22));
  border: 1px solid rgba(125,211,252,.25);
}
.sc-titles { flex: 1; min-width: 0; }
.sc-name { font-size: 14px; font-weight: 700; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sc-sub { font-size: 11px; color: #64748b; margin-top: 1px; }
.sc-latest { margin-top: 10px; display: flex; align-items: baseline; gap: 5px; }
.sc-val { font-size: 26px; font-weight: 800; color: #7dd3fc; font-variant-numeric: tabular-nums; }
.sc-unit { font-size: 11px; color: var(--nx-text-dim); }
.sc-empty { font-size: 13px; color: #475569; }
.sc-spark { height: 40px; margin-top: 6px; }
</style>
