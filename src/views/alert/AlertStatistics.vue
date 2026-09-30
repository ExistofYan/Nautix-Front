<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">告警统计日报</h2>
        <p class="nx-page-desc">近 14 天告警趋势与处置效率（数据源：/alertRecord/list 前端按日分桶）</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div v-loading="loading && !all.length">
      <div class="as-kpis nx-panel">
        <div class="as-kpi">
          <em>今日新增</em><b>{{ todayCount }}</b>
        </div>
        <div class="as-kpi warn">
          <em>待处理</em><b>{{ pendingTotal }}</b>
        </div>
        <div class="as-kpi" :class="handleRate >= 0.8 ? 'ok' : handleRate >= 0.5 ? 'warn' : 'bad'">
          <em>处理率</em><b>{{ (handleRate * 100).toFixed(1) }}%</b>
        </div>
        <div class="as-kpi">
          <em>平均触发值</em><b>{{ avgTrigger }}</b>
        </div>
      </div>

      <div class="nx-panel as-chartbox">
        <div class="ac-title">近 14 天告警趋势</div>
        <div ref="lineEl" class="ac-chart"></div>
      </div>

      <div class="as-tables">
        <div class="nx-panel as-table">
          <div class="ac-title">按日明细</div>
          <el-table :data="daily" stripe max-height="300">
            <el-table-column prop="date" label="日期" min-width="110" />
            <el-table-column prop="total" label="新增" width="90" sortable />
            <el-table-column prop="pending" label="未处理" width="90" sortable />
            <el-table-column label="当日处理率" min-width="160">
              <template #default="{ row }">
                <el-progress :percentage="row.total ? Math.round(((row.total - row.pending) / row.total) * 100) : 0" :stroke-width="8" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="nx-panel as-table">
          <div class="ac-title">规则 Top 5</div>
          <div v-for="(r, i) in topRules" :key="r.ruleId" class="tr-row">
            <span class="tr-rank">#{{ i + 1 }}</span>
            <span class="tr-name">{{ r.ruleName }}</span>
            <span class="tr-count">{{ r.count }}</span>
            <div class="tr-bar"><i :style="{ width: (r.count / (topRules[0]?.count || 1)) * 100 + '%' }"></i></div>
          </div>
          <el-empty v-if="!topRules.length && !loading" description="暂无数据" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { useAlert } from '@/hooks/useAlert'
import type { DailyBucket, EnrichedAlert } from '@/types/alert'

const { store } = useAlert()
const loading = ref(false)
const all = ref<EnrichedAlert[]>([])

const lineEl = ref<HTMLElement>()
const { setOption } = useChart(lineEl)

function dayKey(iso?: string): string | null {
  if (!iso) return null
  const t = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(t.getTime())) return null
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

/** 近 14 天补零分桶 */
const daily = computed<DailyBucket[]>(() => {
  const buckets = new Map<string, DailyBucket>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    buckets.set(k, { date: k.slice(5), total: 0, pending: 0 })
  }
  for (const a of all.value) {
    const k = dayKey(a.alertTime)
    if (!k || !buckets.has(k)) continue
    const b = buckets.get(k)!
    b.total++
    if (a.handleStatus !== 1) b.pending++
  }
  return [...buckets.values()]
})

const todayCount = computed(() => {
  const k = today.slice(5)
  return daily.value.find(d => d.date === k)?.total ?? 0
})
const pendingTotal = computed(() => all.value.filter(a => a.handleStatus !== 1).length)
const handleRate = computed(() => (all.value.length ? (all.value.length - pendingTotal.value) / all.value.length : 0))
const avgTrigger = computed(() => {
  const vals = all.value.map(a => Number(a.triggerValue)).filter(n => Number.isFinite(n))
  return vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length).toFixed(2) : '--'
})
const topRules = computed(() => store.ruleAgg(all.value).slice(0, 5))

async function reload() {
  loading.value = true
  all.value = await store.loadAll()
  loading.value = false
  await nextTick()
  renderLine()
}

function renderLine() {
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增', '未处理'], textStyle: { color: chartTheme.legendText, fontSize: 11 }, top: 0 },
    grid: { left: 10, right: 18, top: 34, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: daily.value.map(d => d.date),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: chartTheme.splitLine } } },
    series: [
      {
        name: '新增',
        type: 'line',
        smooth: true,
        symbolSize: 5,
        data: daily.value.map(d => d.total),
        lineStyle: { color: '#38bdf8', width: 2 },
        itemStyle: { color: '#38bdf8' },
        areaStyle: { color: 'rgba(56,189,248,0.12)' },
      },
      {
        name: '未处理',
        type: 'line',
        smooth: true,
        symbolSize: 5,
        data: daily.value.map(d => d.pending),
        lineStyle: { color: '#fb7185', width: 2 },
        itemStyle: { color: '#fb7185' },
        areaStyle: { color: 'rgba(251,113,133,0.10)' },
      },
    ],
  })
}

onMounted(reload)
</script>

<style scoped>
.as-kpis {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  margin-bottom: 18px;
}
.as-kpi {
  text-align: center;
}
.as-kpi em {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: #7d93b8;
  margin-bottom: 4px;
}
.as-kpi b {
  font-size: 28px;
  color: var(--nx-text);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
.as-kpi.ok b { color: var(--nx-green); }
.as-kpi.warn b { color: var(--nx-amber); }
.as-kpi.bad b { color: var(--nx-red); }
.ac-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 14px 16px 0;
}
.as-chartbox {
  margin-bottom: 18px;
}
.ac-chart {
  height: 300px;
  padding: 6px 12px 12px;
}
.as-tables {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
}
.as-table {
  padding-bottom: 12px;
}
.tr-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 4px;
  font-size: 13px;
  color: var(--nx-text-dim);
}
.tr-rank {
  color: var(--nx-violet);
  font-weight: 700;
  width: 26px;
}
.tr-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tr-count {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--nx-primary);
  font-weight: 700;
}
.tr-bar {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 3px;
  background: rgba(56,189,248,0.10);
  border-radius: 2px;
}
.tr-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #38bdf8, #a78bfa);
}
@media (max-width: 980px) {
  .as-tables { grid-template-columns: 1fr; }
}
</style>
