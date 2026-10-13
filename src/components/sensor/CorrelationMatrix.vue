<template>
  <div class="corr-matrix nx-panel">
    <div class="cm-head">
      <div class="card-title"><el-icon><Grid /></el-icon>传感器相关性矩阵（Pearson）</div>
      <el-select-v2 v-model="shipId" :options="shipOptions" placeholder="全部船舶" clearable style="width: 200px" />
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="matrix.length < 2" :image-size="70" description="可对比的传感器序列不足（需要 trend 数据中至少两路有效序列）">
      <template #image><el-icon :size="56" color="#9ca3af"><Connection /></el-icon></template>
    </el-empty>
    <template v-else>
      <div ref="chartEl" class="cm-chart" :style="{ height: chartHeight }" />
      <div class="cm-pairs">
        <div class="cm-pairs-title">强相关组合 Top {{ topPairs.length }}</div>
        <div v-for="(p, i) in topPairs" :key="i" class="cm-pair">
          <span class="cp-rank">{{ i + 1 }}</span>
          <span class="cp-names">{{ aName(p.a) }} × {{ aName(p.b) }}</span>
          <el-progress
            :percentage="Math.round(Math.abs(p.r) * 100)"
            :stroke-width="8"
            :color="p.r >= 0 ? '#34d399' : '#fb7185'"
            class="cp-bar"
          />
          <span class="cp-val" :class="p.r >= 0 ? 'pos' : 'neg'">{{ p.r.toFixed(3) }}</span>
        </div>
        <div v-if="!topPairs.length" class="cp-none">未发现 |r| ≥ 0.6 的显著相关对</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'

interface Series { name: string; values: Map<string, number> }
interface Pair { a: number; b: number; r: number }

const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()

const loading = computed(() => sensorStore.loading || dataStore.trendLoading)
const shipId = ref<number>()

const shipOptions = computed(() =>
  shipStore.ships.map(s => ({ value: s.id as number, label: `${s.shipName} (${s.id})` })),
)

/** 取样数最多的前 8 路 config 做矩阵，避免图表过大 */
const seriesList = computed<Series[]>(() => {
  const entries = [...dataStore.seriesByConfig.entries()]
    .filter(([id]) => {
      if (shipId.value == null) return true
      return sensorStore.configOf(id)?.shipId === shipId.value
    })
    .map(([id, rows]) => ({
      id,
      name: sensorStore.nameOf(id),
      values: new Map(rows.map(r => [(r.recordedAt || '').slice(0, 19), r.dataValue ?? NaN])),
    }))
    .filter(s => s.values.size > 1)
    .sort((a, b) => b.values.size - a.values.size)
    .slice(0, 8)
  return entries.map(e => ({ name: e.name, values: e.values }))
})

function aName(i: number): string {
  return seriesList.value[i]?.name ?? `#${i}`
}

/** Pearson：只取两条序列时间戳交集；样本 <3 返回 null */
function pearson(a: Map<string, number>, b: Map<string, number>): number | null {
  const xs: number[] = []
  const ys: number[] = []
  for (const [t, va] of a) {
    const vb = b.get(t)
    if (vb == null || !Number.isFinite(va) || !Number.isFinite(vb)) continue
    xs.push(va)
    ys.push(vb)
  }
  const n = xs.length
  if (n < 3) return null
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let cov = 0, vx = 0, vy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my
    cov += dx * dy
    vx += dx * dx
    vy += dy * dy
  }
  if (vx === 0 || vy === 0) return null
  return cov / Math.sqrt(vx * vy)
}

const matrix = computed(() => {
  const list = seriesList.value
  const cells: { x: number; y: number; r: number | null }[] = []
  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list.length; j++) {
      cells.push({ x: j, y: i, r: i === j ? 1 : pearson(list[i].values, list[j].values) })
    }
  }
  return cells
})

const topPairs = computed<Pair[]>(() => {
  const out: Pair[] = []
  const list = seriesList.value
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const r = pearson(list[i].values, list[j].values)
      if (r != null && Math.abs(r) >= 0.6) out.push({ a: i, b: j, r })
    }
  }
  return out.sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, 3)
})

const chartHeight = computed(() => `${Math.max(260, seriesList.value.length * 44 + 110)}px`)

const chartEl = ref<HTMLElement>()
const { setOption } = useChart(chartEl)

function render() {
  const names = seriesList.value.map(s => s.name)
  if (names.length < 2) return
  setOption({
    tooltip: {
      position: 'top',
      formatter: (p: unknown) => {
        const d = (p as { data: { x: number; y: number; r: number | null } }).data
        return `${names[d.y]} × ${names[d.x]}<br/>r = ${d.r == null ? '—' : d.r.toFixed(3)}`
      },
    },
    grid: { left: 130, right: 20, top: 10, bottom: 80 },
    xAxis: { type: 'category', data: names, axisLabel: { color: chartTheme.legendText, fontSize: 10, rotate: 30 }, splitArea: { show: false } },
    yAxis: { type: 'category', data: names, axisLabel: { color: chartTheme.legendText, fontSize: 10 }, splitArea: { show: false } },
    visualMap: {
      min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: chartTheme.legendText, fontSize: 10 },
      inRange: { color: ['#fb7185', '#1e293b', '#34d399'] },
    },
    series: [{
      type: 'heatmap',
      data: matrix.value.filter(c => c.r != null).map(c => ({ ...c, value: [c.x, c.y, Number(c.r!.toFixed(3))] })),
      label: { show: names.length <= 6, color: '#e2e8f0', fontSize: 10, formatter: (p: unknown) => String((p as { data: { r: number | null } }).data.r?.toFixed(2) ?? '') },
      itemStyle: { borderColor: 'rgba(6,13,31,.9)', borderWidth: 2 },
    }],
  })
}

watch([seriesList], render)

/** 全站最新读数是跨船轮转写入的，每路仅 1~2 点，矩阵必然为空；必须按船取数 */
watch(shipId, id => {
  if (id == null) return
  void Promise.all([sensorStore.ensureShipConfigs(id), dataStore.loadTrend(1200, id)]).then(render)
})

onMounted(async () => {
  await Promise.all([sensorStore.load(), shipStore.loadShips(), dataStore.loadTrend(400)])
  const first = shipStore.ships.find(s => s.id != null)?.id
  if (first != null) {
    shipId.value = first
    await Promise.all([sensorStore.ensureShipConfigs(first), dataStore.loadTrend(1200, first)])
  }
  render()
})
</script>

<style scoped>
.corr-matrix { padding: 14px 16px; }
.cm-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #b8d4f5; }
.cm-chart { width: 100%; }
.cm-pairs { margin-top: 10px; border-top: 1px solid var(--nx-panel-border); padding-top: 10px; }
.cm-pairs-title { font-size: 12px; color: var(--nx-text-dim); margin-bottom: 8px; }
.cm-pair { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
.cp-rank {
  width: 20px; height: 20px; border-radius: 6px; flex: none; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; color: #7dd3fc; background: rgba(56,189,248,.12);
}
.cp-names { flex: none; width: 260px; font-size: 12.5px; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-bar { flex: 1; }
.cp-val { width: 56px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; }
.cp-val.pos { color: #34d399; }
.cp-val.neg { color: #fb7185; }
.cp-none { font-size: 12px; color: #64748b; }
</style>
