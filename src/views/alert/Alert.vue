<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">告警中心</h2>
        <p class="nx-page-desc">实时告警流、时段热力与处置概览</p>
      </div>
      <el-button round @click="reloadAll">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <div class="alert-grid" v-loading="loading && !rows.length">
      <AlertTimeline class="grid-timeline" :alerts="rows" :limit="10" @select="openDetail" />

      <div class="nx-panel grid-summary">
        <div class="as-title"><el-icon><PieChart /></el-icon><span>处置状态分布</span></div>
        <div ref="pieEl" class="as-pie"></div>
        <div class="as-kpis">
          <div class="as-kpi">
            <em>总告警</em><b>{{ summaryTotal }}</b>
          </div>
          <div class="as-kpi danger">
            <em>待处理</em><b>{{ pendingCount }}</b>
          </div>
          <div class="as-kpi ok">
            <em>已处理</em><b>{{ handledCount }}</b>
          </div>
        </div>
      </div>

      <AlertHeatmap class="grid-heat" :records="allRecords" />
    </div>

    <AlertDetail v-model:open="drawerOpen" :record="selected" @updated="reloadAll" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useChart, chartTheme } from '@/hooks/useChart'
import { getAlertStatusSummary } from '@/api/dashboard'
import { useAlertStore } from '@/stores/alert'
import AlertTimeline from '@/components/alert/AlertTimeline.vue'
import AlertHeatmap from '@/components/alert/AlertHeatmap.vue'
import AlertDetail from '@/components/alert/AlertDetail.vue'
import type { EnrichedAlert } from '@/types/alert'

const store = useAlertStore()

const pieEl = ref<HTMLElement>()
const { setOption } = useChart(pieEl)

const drawerOpen = ref(false)
const selected = ref<EnrichedAlert | null>(null)

const loading = computed(() => store.loading)
const rows = computed(() => store.records.map(store.enrich))
const allRecords = ref(store.records)
const pendingCount = computed(() => allRecords.value.filter(r => r.handleStatus !== 1).length)
const handledCount = computed(() => allRecords.value.filter(r => r.handleStatus === 1).length)
const summaryTotal = computed(() => allRecords.value.length)

async function reloadAll() {
  await store.load({ page: 1 })
  const list = await store.loadAll()
  allRecords.value = list
  await renderPie()
}

async function renderPie() {
  let data: { name: string; value: number }[] = []
  try {
    const res = await getAlertStatusSummary().catch(() => null)
    data = (res ?? []).map(s => ({ name: statusLabel(s.status), value: s.count }))
  } catch {
    data = []
  }
  if (!data.length) {
    data = [
      { name: '待处理', value: pendingCount.value },
      { name: '已处理', value: handledCount.value },
    ].filter(d => d.value > 0)
  }
  await nextTick()
  setOption({
    backgroundColor: 'transparent',
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: chartTheme.legendText, fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        itemStyle: { borderColor: '#0a1428', borderWidth: 2, borderRadius: 6 },
        label: { show: false },
        data: data.map((d, i) => ({
          ...d,
          itemStyle: { color: chartTheme.palette[i % chartTheme.palette.length] },
        })),
      },
    ],
  })
}

function statusLabel(s?: string): string {
  if (s == null) return '未知'
  const n = Number(s)
  if (n === 1) return '已处理'
  if (n === 0) return '待处理'
  return String(s)
}

function openDetail(a: EnrichedAlert) {
  selected.value = a
  drawerOpen.value = true
}

onMounted(reloadAll)
</script>

<style scoped>
.alert-grid {
  display: grid;
  grid-template-columns: minmax(300px, 1.1fr) minmax(260px, 0.9fr);
  grid-template-rows: auto auto;
  gap: 18px;
  min-height: 420px;
}
.grid-timeline {
  grid-row: span 2;
}
.grid-heat {
  grid-column: 1 / -1;
}
.as-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 16px 18px 0;
}
.grid-summary {
  padding-bottom: 14px;
}
.as-pie {
  height: 220px;
}
.as-kpis {
  display: flex;
  justify-content: space-around;
  padding: 4px 18px 14px;
}
.as-kpi {
  text-align: center;
}
.as-kpi em {
  display: block;
  font-style: normal;
  font-size: 11.5px;
  color: #7d93b8;
}
.as-kpi b {
  font-size: 22px;
  color: var(--nx-text);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
.as-kpi.danger b {
  color: var(--nx-red);
}
.as-kpi.ok b {
  color: var(--nx-green);
}
@media (max-width: 980px) {
  .alert-grid {
    grid-template-columns: 1fr;
  }
  .grid-timeline {
    grid-row: auto;
  }
}
</style>
