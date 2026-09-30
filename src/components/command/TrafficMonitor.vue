<template>
  <div class="traffic nx-panel">
    <div class="head">
      <span><el-icon><Histogram /></el-icon>&nbsp;24 小时告警节律</span>
      <el-tag size="small" effect="dark" round type="info">{{ currentHour }}:00 时段</el-tag>
    </div>
    <div v-show="hasData" ref="chartRef" class="chart"></div>
    <el-empty v-if="!hasData" :image-size="60" description="暂无告警分布数据" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { useCommandStore } from '@/stores/command'

/** 告警小时分布柱状图：当前时段高亮。 */
const store = useCommandStore()
const chartRef = ref<HTMLElement>()
const { setOption } = useChart(chartRef)

const hasData = computed(() => store.hourDist.length > 0)
const currentHour = new Date().getHours()

function render() {
  const dist = store.hourDist
  if (!dist.length) return
  const hours = Array.from({ length: 24 }, (_, h) =>
    dist.find(d => d.hour === h)?.count ?? 0
  )
  setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '3%', top: 28, bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: hours.map((_, h) => `${h}`),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color, interval: 1 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [{
      name: '告警数',
      type: 'bar',
      data: hours.map((v, h) => ({
        value: v,
        itemStyle: h === currentHour
          ? { color: '#fbbf24', shadowBlur: 12, shadowColor: 'rgba(251,191,36,.6)' }
          : { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#38bdf8' }, { offset: 1, color: 'rgba(56,189,248,.15)' }] } },
      })),
      barWidth: '55%',
    }],
  })
}

watch(() => store.hourDist, async () => { await nextTick(); render() }, { deep: true })
onMounted(async () => { await nextTick(); render() })
</script>

<style scoped>
.traffic { padding: 16px 18px; border-radius: 14px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: #e2e8f0; font-weight: 600; font-size: 14px; }
.head span { display: inline-flex; align-items: center; }
.head .el-icon { color: #38bdf8; }
.chart { height: 240px; }
</style>
