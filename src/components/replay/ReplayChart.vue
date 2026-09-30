<template>
  <div class="replay-chart nx-panel">
    <div v-if="title" class="chart-title">{{ title }}</div>
    <div v-show="data.length > 1" ref="el" class="chart-body" />
    <el-empty v-if="data.length <= 1" description="暂无传感器数据" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { SensorData } from '@/api/types'

const props = withDefaults(defineProps<{ data: SensorData[]; cursorIndex?: number; title?: string }>(), {
  cursorIndex: -1,
  title: '',
})

const el = ref<HTMLElement>()
const { setOption } = useChart(el)

function render() {
  const pts = props.data.filter(d => d.dataValue != null)
  if (pts.length < 2) return
  const xs = pts.map(d => (d.recordedAt ?? '').slice(11, 19))
  const ys = pts.map(d => d.dataValue as number)
  const cursorValid = props.cursorIndex >= 0 && props.cursorIndex < pts.length
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    grid: { left: 52, right: 20, top: 30, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: xs,
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: ys,
        lineStyle: { width: 2, color: '#38bdf8' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(56,189,248,0.35)' },
              { offset: 1, color: 'rgba(56,189,248,0.02)' },
            ],
          },
        },
        markLine: cursorValid
          ? {
              symbol: 'none',
              label: { formatter: '回放位置', color: '#a78bfa', fontSize: 10 },
              lineStyle: { color: '#a78bfa', type: 'solid', width: 1.5 },
              data: [{ xAxis: props.cursorIndex }],
            }
          : undefined,
      },
    ],
  })
}

watch(() => [props.data, props.cursorIndex], render, { deep: false })
</script>

<style scoped>
.replay-chart {
  border-radius: 14px;
  padding: 14px 16px;
}
.chart-title {
  font-size: 13px;
  font-weight: 700;
  color: #a8bdd9;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.chart-body {
  height: 260px;
  width: 100%;
}
</style>
