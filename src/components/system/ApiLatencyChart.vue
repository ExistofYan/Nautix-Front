<template>
  <div class="nx-panel lat-card">
    <div class="head">
      <span class="title"><el-icon><TrendCharts /></el-icon> 网关往返延迟</span>
      <span class="meta">{{ sys.samples.length }} 个采样点 · 均值 {{ sys.avgRtt != null ? sys.avgRtt + ' ms' : '--' }}</span>
    </div>
    <div ref="chartEl" class="chart" />
    <div v-if="sys.samples.length < 2" class="overlay-tip">采集中，请稍候…</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useChart, chartTheme } from '@/hooks/useChart'

const sys = useSystemStore()
const chartEl = ref<HTMLElement>()
const { setOption } = useChart(chartEl)

watch(
  () => sys.samples.length,
  () => {
    const pts = sys.samples.slice(-60)
    if (pts.length < 2) return
    setOption({
      textStyle: { color: chartTheme.textStyle.color },
      grid: { left: 44, right: 16, top: 24, bottom: 24 },
      tooltip: { trigger: 'axis', formatter: '{b}<br/>RTT {c} ms' },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: pts.map(p => new Date(p.t).toLocaleTimeString('zh-CN', { hour12: false })),
        axisLine: { lineStyle: { color: chartTheme.axisLine } },
        axisLabel: { color: chartTheme.textStyle.color, interval: Math.ceil(pts.length / 6) as unknown as number },
      },
      yAxis: {
        type: 'value',
        name: 'ms',
        nameTextStyle: { color: chartTheme.textStyle.color },
        axisLine: { show: false },
        axisLabel: { color: chartTheme.textStyle.color },
        splitLine: { lineStyle: { color: chartTheme.splitLine } },
      },
      series: [{
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: pts.map(p => p.rttMs),
        lineStyle: { width: 2, color: '#38bdf8' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(56,189,248,0.35)' },
              { offset: 1, color: 'rgba(56,189,248,0)' },
            ],
          },
        },
        markPoint: {
          symbolSize: 36,
          itemStyle: { color: '#fb7185' },
          label: { color: '#fff', fontSize: 9 },
          data: pts.some(p => !p.ok)
            ? [{ name: '失败', coord: [pts.findIndex(p => !p.ok), pts[pts.findIndex(p => !p.ok)].rttMs], value: 'ERR' }]
            : [],
        },
      }],
    })
  },
)
</script>

<style scoped>
.lat-card { padding: 18px 20px; border-radius: 14px; position: relative; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.meta { font-size: 11.5px; color: #64748b; }
.chart { height: 260px; }
.overlay-tip { position: absolute; inset: 60px 0 0; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 12.5px; pointer-events: none; }
</style>
