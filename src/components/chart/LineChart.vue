<template>
  <div class="line-chart nx-panel">
    <div v-if="title" class="chart-head">
      <span class="chart-title">{{ title }}</span>
      <slot name="extra" />
    </div>
    <el-empty v-if="labels.length === 0 || series.length === 0" :image-size="70" description="暂无数据">
      <template #image>
        <el-icon :size="56" color="#9ca3af"><TrendCharts /></el-icon>
      </template>
    </el-empty>
    <div v-else ref="el" class="chart-box" :style="{ height }" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { Series } from '@/types/chart'
import { paletteAt } from '@/types/chart'

const props = withDefaults(
  defineProps<{
    title?: string
    labels: string[]
    series: Series[]
    /** 指定哪些系列索引放右轴（双轴图） */
    rightAxisSeries?: number[]
    yAxisName?: string
    height?: string
  }>(),
  { height: '320px', rightAxisSeries: () => [] },
)

const el = ref<HTMLElement>()
const { setOption } = useChart(el)

function render() {
  const hasRight = props.rightAxisSeries.length > 0
  setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      textStyle: { color: chartTheme.legendText, fontSize: 11 },
      top: 0,
    },
    grid: { left: 58, right: hasRight ? 58 : 20, top: 40, bottom: 34 },
    xAxis: {
      type: 'category',
      data: props.labels,
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.legendText, fontSize: 10, rotate: props.labels.length > 24 ? 30 : 0 },
    },
    yAxis: hasRight
      ? [
          { type: 'value', scale: true, name: props.yAxisName, axisLabel: { color: chartTheme.legendText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
          { type: 'value', scale: true, axisLabel: { color: chartTheme.legendText }, splitLine: { show: false } },
        ]
      : { type: 'value', scale: true, name: props.yAxisName, axisLabel: { color: chartTheme.legendText }, splitLine: { lineStyle: { color: chartTheme.splitLine } } },
    series: props.series.map((s, i) => ({
      name: s.name,
      type: 'line' as const,
      smooth: true,
      symbolSize: 4,
      showSymbol: props.labels.length <= 60,
      yAxisIndex: hasRight && props.rightAxisSeries.includes(i) ? 1 : 0,
      data: s.data,
      lineStyle: { width: 2, color: s.color ?? paletteAt(i) },
      itemStyle: { color: s.color ?? paletteAt(i) },
    })),
  })
}

watch(() => [props.labels, props.series, props.rightAxisSeries], render, { deep: true })
</script>

<style scoped>
.line-chart { padding: 14px 16px; }
.chart-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.chart-title { font-size: 14px; font-weight: 600; color: #b8d4f5; }
.chart-box { width: 100%; }
</style>
