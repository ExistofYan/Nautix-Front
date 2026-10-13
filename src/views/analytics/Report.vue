<template>
  <div class="nx-page report-center">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Document /></el-icon> 综合报表中心</h2>
        <p class="nx-page-desc">口径：/dashboard/stats + /shipInfo/all + /runtime + /alertRecord/list + /route/page 前端聚合 · 生成时间 {{ stamp }}</p>
      </div>
      <div class="hdr-actions">
        <el-button round :loading="loading" @click="load"><el-icon><Refresh /></el-icon> 重新生成</el-button>
        <el-button type="primary" round @click="print"><el-icon><Printer /></el-icon> 打印 / 导出 PDF</el-button>
      </div>
    </div>

    <!-- 一、平台总览 -->
    <GlassPanel title="一、平台总览" :icon="DataBoard">
      <div class="kpi-row">
        <div class="kpi"><span class="kv">{{ stats?.shipCount ?? '--' }}</span><span class="kl">在管船舶</span></div>
        <div class="kpi"><span class="kv warn">{{ stats?.alertCount ?? '--' }}</span><span class="kl">未处理告警</span></div>
        <div class="kpi"><span class="kv">{{ stats?.sensorConfigCount ?? '--' }}</span><span class="kl">传感器配置</span></div>
        <div class="kpi"><span class="kv">{{ stats?.weatherCount ?? '--' }}</span><span class="kl">天气区域</span></div>
        <div class="kpi"><span class="kv">{{ ships.length }}</span><span class="kl">本次拉取船舶档案</span></div>
        <div class="kpi"><span class="kv">{{ routesTotal }}</span><span class="kl">航线总数</span></div>
      </div>
    </GlassPanel>

    <!-- 二、船型构成 -->
    <GlassPanel title="二、船型构成" :icon="PieChart">
      <div ref="typeEl" class="chart-sm" />
      <div v-if="!loading && !typeDist.length" class="empty-mini">暂无数据（后端未启动）</div>
    </GlassPanel>

    <!-- 三、船队运营概览 -->
    <GlassPanel title="三、船队运营概览（按运营公司）" :icon="Grid">
      <el-table :data="fleetRows" size="small" stripe max-height="360">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="company" label="运营公司" min-width="220" show-overflow-tooltip />
        <el-table-column prop="shipCount" label="船舶数" width="90" sortable />
        <el-table-column label="平均实时航速" width="140">
          <template #default="{ row }">{{ num(row.avgSpeed, 1) }} kn</template>
        </el-table-column>
        <el-table-column label="平均燃油存量" width="140">
          <template #default="{ row }">{{ num(row.avgFuel, 1) }} %</template>
        </el-table-column>
      </el-table>
    </GlassPanel>

    <!-- 四、燃油风险 -->
    <GlassPanel title="四、燃油风险（低油量 &lt; 15%）" :icon="Warning">
      <div class="fuel-line">
        上报船位 {{ fuelStat.total }} 艘 · 低油量 <b class="warn">{{ fuelStat.lowCount }}</b> 艘
      </div>
      <div ref="fuelEl" class="chart-sm" />
    </GlassPanel>

    <!-- 五、告警态势 -->
    <GlassPanel title="五、告警触发规则 Top 8" :icon="Bell">
      <el-table :data="ruleRows.slice(0, 8)" size="small" stripe max-height="320">
        <el-table-column prop="ruleName" label="规则" min-width="200" show-overflow-tooltip />
        <el-table-column prop="count" label="触发次数" width="110" sortable />
        <el-table-column prop="pending" label="待处理" width="100" />
        <el-table-column label="等级" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="dark" :type="row.alertLevel && row.alertLevel >= 3 ? 'danger' : 'warning'">
              L{{ row.alertLevel ?? '?' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </GlassPanel>

    <!-- 六、里程最长航线 -->
    <GlassPanel title="六、里程最长航线 Top 10" :icon="Guide">
      <el-table :data="topRoutes" size="small" stripe max-height="320">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="routeName" label="航线" min-width="220" show-overflow-tooltip />
        <el-table-column label="里程（海里）" width="140">
          <template #default="{ row }">{{ num(row.distanceNm, 1) }}</template>
        </el-table-column>
      </el-table>
    </GlassPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Document, Printer, DataBoard, PieChart, Grid, Warning, Bell, Guide } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import { getDashboardStats, getShipTypeDistribution, type DashboardStats } from '@/api/dashboard'
import { getAllShipsCached } from '@/api/ship'
import { getTopRoutesByDistance } from '@/api/route'
import { getFleetCompanyDist, getFuelDistribution, getRuleTriggerStats, type FleetRow, type FuelStat, type RuleTriggerRow } from '@/api/analytics'
import type { Route, ShipInfo } from '@/api/types'
import { useChart, chartTheme } from '@/hooks/useChart'

const loading = ref(false)
const stamp = ref('')
const stats = ref<DashboardStats | null>(null)
const ships = ref<ShipInfo[]>([])
const typeDist = ref<{ type: string; count: number }[]>([])
const fleetRows = ref<FleetRow[]>([])
const fuelStat = ref<FuelStat>({ total: 0, lowCount: 0, buckets: [] })
const ruleRows = ref<RuleTriggerRow[]>([])
const topRoutes = ref<Route[]>([])
const routesTotal = ref<number | string>('--')

const typeEl = ref<HTMLElement>()
const fuelEl = ref<HTMLElement>()
const typeC = useChart(typeEl)
const fuelC = useChart(fuelEl)

function num(v: number | null | undefined, d: number) { return v == null || Number.isNaN(v) ? '--' : v.toFixed(d) }

function render() {
  if (typeDist.value.length) {
    typeC.setOption({
      textStyle: { color: chartTheme.textStyle.color },
      tooltip: { trigger: 'item', formatter: '{b}: {c} 艘 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: chartTheme.legendText } },
      series: [{
        type: 'pie', radius: ['40%', '66%'], center: ['50%', '44%'],
        itemStyle: { borderColor: '#0a1428', borderWidth: 2 },
        label: { color: chartTheme.textStyle.color },
        data: typeDist.value.map(t => ({ name: t.type || '未知', value: t.count })),
      }],
    })
  }
  const b = fuelStat.value.buckets
  if (b.length) {
    fuelC.setOption({
      textStyle: { color: chartTheme.textStyle.color },
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category', data: b.map(x => x.label),
        axisLine: { lineStyle: { color: chartTheme.axisLine } },
        axisLabel: { color: chartTheme.textStyle.color },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: chartTheme.axisLine } },
        axisLabel: { color: chartTheme.textStyle.color },
        splitLine: { lineStyle: { color: chartTheme.splitLine } },
      },
      series: [{
        type: 'bar', data: b.map(x => x.count), barWidth: '50%',
        itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#fb7185' }, { offset: 1, color: '#2563eb' }] } },
        label: { show: true, position: 'top', color: '#94a3b8' },
      }],
    })
  }
}

async function load() {
  loading.value = true
  try {
    const [st, td, sh, fl, fu, ru, tr] = await Promise.all([
      getDashboardStats().catch(() => null),
      getShipTypeDistribution().catch(() => [] as { type: string; count: number }[]),
      getAllShipsCached().catch(() => [] as ShipInfo[]),
      getFleetCompanyDist().catch(() => [] as FleetRow[]),
      getFuelDistribution().catch(() => ({ total: 0, lowCount: 0, buckets: [] }) as FuelStat),
      getRuleTriggerStats().catch(() => [] as RuleTriggerRow[]),
      getTopRoutesByDistance(10).catch(() => null),
    ])
    stats.value = st
    typeDist.value = Array.isArray(td) ? td : []
    ships.value = Array.isArray(sh) ? sh : []
    fleetRows.value = Array.isArray(fl) ? fl : []
    fuelStat.value = fu
    ruleRows.value = Array.isArray(ru) ? ru : []
    topRoutes.value = tr?.records ?? []
    routesTotal.value = tr?.total ?? '--'
    stamp.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch {
    /* keep whatever loaded; panels fall back to empty states */
  } finally {
    loading.value = false
    render()
  }
}

function print() { window.print() }

onMounted(load)
</script>

<style scoped>
.report-center { display: flex; flex-direction: column; gap: 18px; }
.hdr-actions { display: flex; gap: 10px; }
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.kpi { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; background: rgba(9, 17, 35, 0.55); border: 1px solid var(--nx-panel-border); border-radius: 12px; }
.kv { font-size: 26px; font-weight: 800; color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; }
.kv.warn { color: #fb7185; }
.kl { font-size: 12px; color: var(--nx-text-dim); }
.fuel-line { font-size: 13px; color: var(--nx-text-dim); margin-bottom: 8px; }
.fuel-line .warn { color: #fb7185; font-size: 16px; }
.chart-sm { height: 280px; }
.empty-mini { text-align: center; font-size: 12px; color: #64748b; padding: 12px 0; }
@media print {
  .hdr-actions { display: none; }
  .nx-page { background: transparent; }
}
</style>
