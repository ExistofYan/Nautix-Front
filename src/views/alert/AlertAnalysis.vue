<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">告警规则分析</h2>
        <p class="nx-page-desc">按触发规则聚合的全站告警画像（数据源：/alertRecord/list × /alertRule）</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div v-loading="loading && !agg.length" class="aa-grid">
      <div class="nx-panel aa-kpis">
        <div class="aa-kpi">
          <em>告警总数</em><b>{{ total }}</b>
        </div>
        <div class="aa-kpi">
          <em>处理率</em><b :class="handleRate >= 0.8 ? 'ok' : handleRate >= 0.5 ? 'mid' : 'bad'">{{ (handleRate * 100).toFixed(1) }}%</b>
        </div>
        <div class="aa-kpi">
          <em>活跃规则</em><b>{{ agg.length }}</b>
        </div>
        <div class="aa-kpi">
          <em>最高频规则</em><b class="name">{{ topName }}</b>
        </div>
      </div>

      <div class="nx-panel aa-barbox">
        <div class="ab-title">规则触发次数 Top</div>
        <div ref="barEl" class="ab-chart"></div>
      </div>

      <div class="nx-panel aa-piebox">
        <div class="ab-title">等级分布</div>
        <div ref="pieEl" class="ap-chart"></div>
      </div>

      <div class="nx-panel aa-table">
        <div class="ab-title">明细</div>
        <el-table :data="agg" stripe max-height="360">
          <el-table-column prop="ruleName" label="规则" min-width="180" show-overflow-tooltip />
          <el-table-column label="等级" width="90">
            <template #default="{ row }">
              <span :style="{ color: LEVEL_COLOR[levelOf(row.alertLevel)], fontWeight: 700 }">
                L{{ row.alertLevel ?? '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="count" label="触发次数" width="110" sortable />
          <el-table-column prop="pending" label="待处理" width="100" sortable />
          <el-table-column label="处理进度" min-width="160">
            <template #default="{ row }">
              <el-progress
                :percentage="row.count ? Math.round(((row.count - row.pending) / row.count) * 100) : 0"
                :stroke-width="8"
                striped
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { useAlertStore } from '@/stores/alert'
import { LEVEL_COLOR, levelOf, type EnrichedAlert } from '@/types/alert'

const store = useAlertStore()
const loading = ref(false)
const all = ref<EnrichedAlert[]>([])

const barEl = ref<HTMLElement>()
const pieEl = ref<HTMLElement>()
const { setOption: setBar } = useChart(barEl)
const { setOption: setPie } = useChart(pieEl)

const agg = computed(() => store.ruleAgg(all.value))
const total = computed(() => all.value.length)
const handled = computed(() => all.value.filter(a => a.handleStatus === 1).length)
const handleRate = computed(() => (total.value ? handled.value / total.value : 0))
const topName = computed(() => agg.value[0]?.ruleName || '--')

async function reload() {
  loading.value = true
  all.value = await store.loadAll()
  loading.value = false
  await nextTick()
  renderCharts()
}

function renderCharts() {
  const rows = agg.value.slice(0, 12)
  setBar({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 24, top: 10, bottom: 6, containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map(r => r.ruleName),
      axisLabel: { width: 130, overflow: 'truncate', fontSize: 11 },
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
    },
    series: [
      {
        type: 'bar',
        stack: 's',
        data: rows.map(r => ({ value: r.count - r.pending, itemStyle: { color: '#34d399', borderRadius: [0, 0, 4, 4] } })),
        name: '已处理',
      },
      {
        type: 'bar',
        stack: 's',
        data: rows.map(r => ({ value: r.pending, itemStyle: { color: '#fb7185', borderRadius: [0, 4, 4, 0] } })),
        name: '待处理',
      },
    ],
  })

  const byLevel = new Map<string, number>()
  for (const a of all.value) byLevel.set(a.levelKey, (byLevel.get(a.levelKey) ?? 0) + 1)
  setPie({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: chartTheme.legendText, fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '44%'],
        label: { show: false },
        itemStyle: { borderColor: '#0a1428', borderWidth: 2, borderRadius: 6 },
        data: [...byLevel.entries()].map(([k, v]) => ({
          name: k === 'critical' ? '紧急' : k === 'warning' ? '警告' : '提示',
          value: v,
          itemStyle: { color: LEVEL_COLOR[k as keyof typeof LEVEL_COLOR] },
        })),
      },
    ],
  })
}

onMounted(reload)
</script>

<style scoped>
.aa-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
}
.aa-kpis {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-around;
  padding: 18px;
}
.aa-kpi {
  text-align: center;
}
.aa-kpi em {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: #7d93b8;
  margin-bottom: 4px;
}
.aa-kpi b {
  font-size: 26px;
  color: var(--nx-text);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
.aa-kpi b.name {
  font-size: 16px;
  font-family: inherit;
  color: var(--nx-primary);
}
.aa-kpi .ok { color: var(--nx-green); }
.aa-kpi .mid { color: var(--nx-amber); }
.aa-kpi .bad { color: var(--nx-red); }
.ab-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 14px 16px 0;
}
.ab-chart {
  height: 320px;
  padding: 6px 10px 12px;
}
.ap-chart {
  height: 320px;
  padding: 6px 10px 12px;
}
.aa-table {
  grid-column: 1 / -1;
  padding-bottom: 14px;
}
@media (max-width: 980px) {
  .aa-grid { grid-template-columns: 1fr; }
}
</style>
