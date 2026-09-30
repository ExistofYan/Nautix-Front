<template>
  <div class="sensor-value">
    <MetricValue :value="value" :unit="unit" :precision="precision" :color="valueColor" />
    <span v-if="trend !== 'flat'" class="sv-trend" :class="'t-' + trend">
      <el-icon :size="12"><component :is="trend === 'up' ? ArrowUp : ArrowDown" /></el-icon>
      {{ deltaText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import MetricValue from '@/components/common/MetricValue.vue'

const props = withDefaults(
  defineProps<{
    value: number | null
    unit?: string
    precision?: number
    trend?: 'up' | 'down' | 'flat'
    /** 相对上一采样点的差值 */
    delta?: number | null
    /** 异常标红阈值（|delta| 超过即视为波动异常） */
    abnormalDelta?: number
  }>(),
  { precision: 2, trend: 'flat', delta: null, abnormalDelta: undefined },
)

const valueColor = computed(() => {
  if (props.abnormalDelta != null && props.delta != null && Math.abs(props.delta) > props.abnormalDelta) {
    return '#fb7185'
  }
  return undefined
})

const deltaText = computed(() => {
  if (props.delta == null) return ''
  const a = Math.abs(props.delta)
  return a >= 100 ? a.toFixed(0) : a.toFixed(2)
})
</script>

<style scoped>
.sensor-value { display: inline-flex; align-items: baseline; gap: 6px; }
.sv-trend { display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; }
.t-up { color: #34d399; }
.t-down { color: #fb7185; }
</style>
