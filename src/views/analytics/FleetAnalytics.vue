<template>
  <div class="nx-page fleet-an">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Ship /></el-icon> 船队分析</h2>
        <p class="nx-page-desc">按运营公司聚合在管船舶 · 口径：/shipInfo/all + /runtime 前端派生</p>
      </div>
      <el-button round :loading="loading" @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <GlassPanel title="公司规模 Top 10（艘数）" :icon="Grid">
      <div ref="barEl" class="chart" />
      <div v-if="!loading && !rows.length" class="empty-mini">暂无船舶数据</div>
    </GlassPanel>

    <GlassPanel title="公司明细" :icon="List">
      <el-table :data="rows" size="small" stripe max-height="480">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="company" label="运营公司" min-width="200" show-overflow-tooltip />
        <el-table-column prop="shipCount" label="船舶数" width="90" sortable />
        <el-table-column label="平均实时航速" width="130" sortable :sort-by="(r: FleetRow) => r.avgSpeed ?? -1">
          <template #default="{ row }">{{ num(row.avgSpeed, 1) }} kn</template>
        </el-table-column>
        <el-table-column label="平均燃油存量" width="150" sortable :sort-by="(r: FleetRow) => r.avgFuel ?? -1">
          <template #default="{ row }">
            <el-progress
              v-if="row.avgFuel != null"
              :percentage="clamp(row.avgFuel)"
              :stroke-width="6"
              :color="row.avgFuel < 20 ? '#fb7185' : '#34d399'"
            />
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !rows.length" description="后端未启动或无船舶档案" :image-size="70" />
    </GlassPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Grid, List } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import { getFleetCompanyDist, type FleetRow } from '@/api/analytics'
import { useChart, chartTheme } from '@/hooks/useChart'

const rows = ref<FleetRow[]>([])
const loading = ref(false)
const barEl = ref<HTMLElement>()
const { setOption } = useChart(barEl)

function clamp(v: number) { return Math.max(0, Math.min(100, Math.round(v))) }
function num(v: number | null, d: number) { return v == null ? '--' : v.toFixed(d) }

function render() {
  const top = rows.value.slice(0, 10).reverse()
  if (!top.length) return
  setOption({
    textStyle: { color: chartTheme.textStyle.color },
    grid: { left: 8, right: 40, top: 10, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    yAxis: {
      type: 'category',
      data: top.map(r => r.company),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color, width: 130, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      data: top.map(r => r.shipCount),
      barWidth: 14,
      itemStyle: {
        borderRadius: [0, 7, 7, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#2563eb' }, { offset: 1, color: '#38bdf8' }] },
      },
      label: { show: true, position: 'right', color: '#94a3b8' },
    }],
  })
}

async function load() {
  loading.value = true
  try {
    rows.value = await getFleetCompanyDist()
  } catch {
    rows.value = []
  } finally {
    loading.value = false
    render()
  }
}

onMounted(load)
</script>

<style scoped>
.fleet-an { display: flex; flex-direction: column; gap: 18px; }
.chart { height: 320px; }
.empty-mini { text-align: center; font-size: 12px; color: #64748b; padding: 12px 0; }
</style>
