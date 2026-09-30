<template>
  <div class="sensor-chart nx-panel">
    <div v-if="title" class="chart-head">
      <span class="chart-title">{{ title }}</span>
      <el-tag v-if="unit" size="small" effect="plain" round>{{ unit }}</el-tag>
      <slot name="extra" />
    </div>
    <el-empty
      v-if="data.length === 0"
      :image-size="70"
      description="暂无传感器数据"
    >
      <template #image>
        <el-icon :size="56" color="#9ca3af"><DataLine /></el-icon>
      </template>
    </el-empty>
    <div v-else ref="el" class="chart-box" :style="{ height }" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { SensorPoint } from '@/types/sensor'

const props = withDefaults(
  defineProps<{
    title?: string
    unit?: string
    data: SensorPoint[]
    height?: string
    color?: string
  }>(),
  { height: '280px', color: '#22d3ee' },
)

const el = ref<HTMLElement>()
const { setOption } = useChart(el)

function render() {
  if (props.data.length === 0) return
  setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 56, right: 20, top: 24, bottom: 34 },
    xAxis: {
      type: 'category',
      data: props.data.map(p => p.t),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.legendText, fontSize: 10, rotate: props.data.length > 24 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { color: chartTheme.legendText },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbolSize: 5,
        data: props.data.map(p => p.v),
        lineStyle: { width: 2, color: props.color },
        itemStyle: { color: props.color },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(props.color, 0.32) },
              { offset: 1, color: hexToRgba(props.color, 0.02) },
            ],
          },
        },
      },
    ],
  })
}

function hexToRgba(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return `rgba(34,211,238,${a})`
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

watch(() => [props.data, props.color], render, { deep: true })
</script>

<style scoped>
.sensor-chart { padding: 14px 16px; }
.chart-head {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.chart-title { font-size: 14px; font-weight: 600; color: #b8d4f5; }
.chart-box { width: 100%; }
</style>
