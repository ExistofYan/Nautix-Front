<template>
  <div class="alert-heatmap nx-panel">
    <div class="ah-title">
      <el-icon><Grid /></el-icon>
      <span>告警时段热力（周 × 小时）</span>
      <em>{{ records.length }} 条样本</em>
    </div>
    <div v-show="hasData" ref="chartEl" class="ah-chart"></div>
    <el-empty v-if="!hasData" description="暂无可解析的告警时间数据" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { AlertRecord } from '@/api/types'

const props = defineProps<{ records: AlertRecord[] }>()

const chartEl = ref<HTMLElement>()
const { setOption } = useChart(chartEl)

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** alertTime → (dayIndex 0=周一, hour) */
function parseCell(iso?: string): { day: number; hour: number } | null {
  if (!iso) return null
  const t = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(t.getTime())) return null
  const jsDay = t.getDay() // 0=周日
  return { day: (jsDay + 6) % 7, hour: t.getHours() }
}

const cells = computed(() => {
  const map = new Map<string, number>()
  for (const r of props.records) {
    const c = parseCell(r.alertTime)
    if (!c) continue
    const k = `${c.day}:${c.hour}`
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return map
})

const hasData = computed(() => cells.value.size > 0)

function render() {
  const data: [number, number, number][] = []
  let max = 0
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = cells.value.get(`${d}:${h}`) ?? 0
      data.push([h, d, v])
      if (v > max) max = v
    }
  }
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: {
      formatter: (p: unknown) => {
        const q = p as { data: [number, number, number] }
        return `${DAY_LABELS[q.data[1]]} ${String(q.data[0]).padStart(2, '0')}:00 — ${q.data[2]} 起`
      },
    },
    grid: { left: 48, right: 18, top: 8, bottom: 52 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => String(i)),
      splitArea: { show: false },
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: DAY_LABELS,
      splitArea: { show: false },
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
    },
    visualMap: {
      min: 0,
      max: Math.max(1, max),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 10,
      textStyle: { color: '#7d93b8', fontSize: 10 },
      inRange: { color: ['#0c1a30', '#155e75', '#0ea5e9', '#fbbf24', '#fb7185'] },
    },
    series: [
      {
        type: 'heatmap',
        data,
        itemStyle: { borderRadius: 2, borderColor: 'rgba(6,13,31,0.9)', borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(56,189,248,0.5)' } },
      },
    ],
  })
}

watch(
  () => props.records,
  async () => {
    if (hasData.value) {
      await nextTick()
      render()
    }
  },
  { immediate: true, deep: false }
)
</script>

<style scoped>
.alert-heatmap {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ah-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
}
.ah-title em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  color: #7d93b8;
}
.ah-chart {
  height: 260px;
  width: 100%;
}
</style>
