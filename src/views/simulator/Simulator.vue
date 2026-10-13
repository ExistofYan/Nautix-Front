<template>
  <div class="nx-page sim-console">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><MagicStick /></el-icon> 模拟器控制台</h2>
        <p class="nx-page-desc">纯观测面板 · 实时上报流与传感器产出（只读，不下发控制指令）</p>
      
      <el-tag size="small" effect="dark" round :type="wsConnected ? 'success' : 'info'">{{ wsConnected ? 'WS 已连接' : 'WS 轮询降级' }}</el-tag>
      </div>
      <div class="acts">
        <el-switch v-model="auto" active-text="自动刷新" />
        <el-button round :loading="loading" @click="loadAll"><el-icon><Refresh /></el-icon> 刷新</el-button>
      </div>
    </div>

    <div class="top-grid">
      <GlassPanel title="数据新鲜度" :icon="Stopwatch">
        <div class="fresh-row">
          <el-progress type="circle" :width="110" :percentage="freshPct" :color="freshColor">
            <template #default>
              <div class="f-center">
                <b>{{ freshAgeSec == null ? '--' : freshAgeSec + 's' }}</b>
                <i>最后写入距今</i>
              </div>
            </template>
          </el-progress>
          <ul class="f-list">
            <li><i>上报船舶</i><b>{{ rt.rows.length }}</b></li>
            <li><i>trend 样本</i><b>{{ trend.length }}</b></li>
            <li><i>最近记录</i><b>{{ latestText }}</b></li>
          </ul>
        </div>
      </GlassPanel>

      <GlassPanel title="航行状态分布" :icon="Compass">
        <div ref="statusChartEl" class="chart-sm" />
        <div v-if="!rt.rows.length" class="empty-mini">暂无 runtime 数据</div>
      </GlassPanel>
    </div>

    <GlassPanel title="实时上报流" :icon="List">
      <el-table v-loading="loading" :data="rt.rows.slice(0, 60)" size="small" stripe max-height="360">
        <el-table-column label="船名" min-width="150">
          <template #default="{ row }">{{ shipName(row.shipId) }}</template>
        </el-table-column>
        <el-table-column prop="sailingStatus" label="状态" width="110" />
        <el-table-column label="经度" width="110"><template #default="{ row }">{{ fx(row.longitude, 4) }}</template></el-table-column>
        <el-table-column label="纬度" width="110"><template #default="{ row }">{{ fx(row.latitude, 4) }}</template></el-table-column>
        <el-table-column label="航速" width="90"><template #default="{ row }">{{ fx(row.speed, 1) }} kn</template></el-table-column>
        <el-table-column label="航向" width="80"><template #default="{ row }">{{ fx(row.heading, 0) }}°</template></el-table-column>
        <el-table-column label="主机负荷" width="90"><template #default="{ row }">{{ fx(row.engineLoad, 0) }}%</template></el-table-column>
        <el-table-column label="燃油" width="80"><template #default="{ row }">{{ fx(row.fuelPercent, 0) }}%</template></el-table-column>
        <el-table-column label="更新时间" width="170"><template #default="{ row }">{{ fmtTime(row.lastUpdate) }}</template></el-table-column>
      </el-table>
      <el-empty v-if="!loading && !rt.rows.length" description="后端未启动或模拟器已停止" :image-size="70" />
    </GlassPanel>

    <GlassPanel title="最近传感器记录（/sensorData/trend）" :icon="TrendCharts">
      <div ref="trendChartEl" class="chart" />
      <div v-if="!trend.length" class="empty-mini">暂无传感器趋势数据</div>
    </GlassPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { WebSocketMessage } from '@/types/WebSocketMessage'
import { Stopwatch, Compass, List, TrendCharts } from '@element-plus/icons-vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import { useRuntimeStore } from '@/stores/runtime'
import { getAllShipsCached } from '@/api/ship'
import { getSensorTrendData } from '@/api/sensor'
import { useChart, chartTheme } from '@/hooks/useChart'
import type { ShipInfo, SensorData } from '@/api/types'

const rt = useRuntimeStore()
const ships = ref<ShipInfo[]>([])
const trend = ref<SensorData[]>([])
const loading = ref(false)
const auto = ref(true)

const statusChartEl = ref<HTMLElement>()
const trendChartEl = ref<HTMLElement>()
const statusChart = useChart(statusChartEl)
const trendChart = useChart(trendChartEl)

const shipMap = computed(() => new Map(ships.value.filter(s => s.id != null).map(s => [s.id as number, s])))
function shipName(id?: number) { return id != null ? shipMap.value.get(id)?.shipName || `船 #${id}` : '—' }

const latestTs = computed<number | null>(() => {
  let max: number | null = null
  for (const d of trend.value) {
    if (!d.recordedAt) continue
    const t = new Date(d.recordedAt).getTime()
    if (Number.isFinite(t) && (max == null || t > max)) max = t
  }
  return max
})
const freshAgeSec = computed(() => (latestTs.value == null ? null : Math.max(0, Math.round((Date.now() - latestTs.value) / 1000))))
const freshPct = computed(() => {
  const age = freshAgeSec.value
  if (age == null) return 0
  return Math.max(2, Math.min(100, Math.round(100 - (age / 300) * 100)))
})
const freshColor = computed(() => (freshPct.value > 60 ? '#34d399' : freshPct.value > 25 ? '#fbbf24' : '#fb7185'))
const latestText = computed(() => (latestTs.value == null ? '--' : new Date(latestTs.value).toLocaleTimeString('zh-CN', { hour12: false })))

function renderStatus() {
  const dist = new Map<string, number>()
  for (const r of rt.rows) {
    const k = r.sailingStatus || '未知'
    dist.set(k, (dist.get(k) ?? 0) + 1)
  }
  const data = [...dist.entries()].map(([name, value]) => ({ name, value }))
  if (!data.length) return
  statusChart.setOption({
    textStyle: { color: chartTheme.textStyle.color },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 艘 ({d}%)' },
    legend: { bottom: 0, textStyle: { color: chartTheme.textStyle.color, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'],
      itemStyle: { borderRadius: 6, borderColor: '#0a1428', borderWidth: 2 },
      label: { show: false },
      data,
    }],
  })
}

function renderTrend() {
  if (trend.value.length < 2) return
  const sorted = [...trend.value].sort((a, b) => (a.recordedAt || '').localeCompare(b.recordedAt || ''))
  trendChart.setOption({
    textStyle: { color: chartTheme.textStyle.color },
    grid: { left: 46, right: 16, top: 26, bottom: 26 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sorted.map(d => (d.recordedAt || '').slice(11, 19)),
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textStyle.color, interval: Math.ceil(sorted.length / 8) as unknown as number },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: chartTheme.textStyle.color },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [{
      name: 'dataValue',
      type: 'line', smooth: true, symbol: 'none',
      data: sorted.map(d => d.dataValue ?? 0),
      lineStyle: { width: 2, color: '#34d399' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(52,211,153,0.3)' }, { offset: 1, color: 'rgba(52,211,153,0)' }],
        },
      },
    }],
  })
}

async function loadAll() {
  loading.value = true
  await rt.refresh()
  try { if (!ships.value.length) ships.value = (await getAllShipsCached()) ?? [] } catch { /* empty */ }
  try { trend.value = (await getSensorTrendData(120)) ?? [] } catch { trend.value = [] }
  renderStatus()
  renderTrend()
  loading.value = false
}

let timer: number | undefined
watch(auto, (on) => {
  if (timer !== undefined) { clearInterval(timer); timer = undefined }
  if (on) timer = window.setInterval(loadAll, 6000)
})

/* ---- 实时推送通道（后端未开 WS 时自动重连静默待命；收到 runtime 推送即刷新） ---- */
const wsUrl = () => ((import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:1910/ws/runtime')
const { connected: wsConnected, on: wsOn } = useWebSocket(wsUrl)
wsOn('message', (data: unknown) => {
  // hook 已对 JSON 帧做过解析，这里直接按消息体类型分发
  const msg = data as WebSocketMessage | null
  if (msg && typeof msg === 'object' && msg.type === 'runtime') void loadAll()
})

onMounted(async () => {
  await loadAll()
  if (auto.value) timer = window.setInterval(loadAll, 6000)
})
onUnmounted(() => { if (timer !== undefined) clearInterval(timer) })

function fx(v: number | undefined, d: number) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d) }
function fmtTime(t?: string) {
  if (!t) return '—'
  const dt = new Date(t)
  return Number.isNaN(dt.getTime()) ? t : dt.toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.sim-console { display: flex; flex-direction: column; gap: 18px; }
.acts { display: flex; align-items: center; gap: 12px; }
.top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.fresh-row { display: flex; align-items: center; gap: 22px; }
.f-center { text-align: center; line-height: 1.3; }
.f-center b { font-size: 18px; color: var(--nx-text); font-family: Consolas, monospace; }
.f-center i { display: block; font-style: normal; font-size: 10.5px; color: #64748b; }
.f-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.f-list li { display: flex; justify-content: space-between; gap: 18px; font-size: 12.5px; }
.f-list i { font-style: normal; color: var(--nx-text-dim); }
.f-list b { color: #7dd3fc; font-family: Consolas, monospace; }
.chart { height: 240px; }
.chart-sm { height: 200px; }
.empty-mini { text-align: center; font-size: 12px; color: #64748b; padding: 10px 0; }
@media (max-width: 1100px) { .top-grid { grid-template-columns: 1fr; } }
</style>
