<template>
  <div class="ship-detail nx-panel">
    <div class="sd-head">
      <div class="sd-avatar"><el-icon :size="26"><Ship /></el-icon></div>
      <div class="sd-title-wrap">
        <h3 class="sd-name">{{ ship?.shipName || '未选择船舶' }}</h3>
        <span class="sd-sub">{{ ship?.shipType || '--' }} · {{ ship?.imo || 'IMO --' }}</span>
      </div>
      <el-button size="small" text :loading="loading" @click="load">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <template v-if="ship">
      <div class="sd-grid">
        <div class="sd-item"><em>船籍港</em><b>{{ ship.registryPort || '--' }}</b></div>
        <div class="sd-item"><em>建造年份</em><b>{{ ship.buildYear ?? '--' }}</b></div>
        <div class="sd-item"><em>总长</em><b>{{ fmt(ship.lengthOverall) }} m</b></div>
        <div class="sd-item"><em>型宽</em><b>{{ fmt(ship.beam) }} m</b></div>
        <div class="sd-item"><em>吃水</em><b>{{ fmt(ship.draft) }} m</b></div>
        <div class="sd-item"><em>排水量</em><b>{{ fmt(ship.displacement, 0) }} t</b></div>
        <div class="sd-item"><em>主机型号</em><b>{{ ship.mainEngineModel || '--' }}</b></div>
        <div class="sd-item"><em>服务航速</em><b>{{ fmt(ship.sailingSpeed) }} kn</b></div>
        <div class="sd-item"><em>造船厂</em><b>{{ ship.shipyardBuilder || '--' }}</b></div>
        <div class="sd-item"><em>运营公司</em><b>{{ ship.operatingCompany || '--' }}</b></div>
        <div class="sd-item"><em>检验有效期</em><b>{{ ship.surveyValidDate || '--' }}</b></div>
      </div>

      <div class="sd-runtime">
        <ShipStatus :runtime="runtime" title="实时运行 Runtime" />
      </div>

      <div v-if="speedSeries.length > 1" class="sd-chart">
        <div class="sc-title">近 {{ speedSeries.length }} 次采样航速</div>
        <div ref="chartEl" class="sc-canvas"></div>
      </div>
    </template>

    <el-empty v-else :image-size="70" description="从海图或列表中选择一艘船查看详情" />
  </div>
</template>

<script setup lang="ts">
/** 船舶档案详情：全部 ShipInfo 字段 + runtime 实时面板 + 前端采样速度小折线 */
import { nextTick, ref, watch } from 'vue'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'
import { getRuntimeByShip } from '@/api/ship'
import { useChart, chartTheme } from '@/hooks/useChart'
import ShipStatus from './ShipStatus.vue'

const props = defineProps<{ ship?: ShipInfo | null }>()

const loading = ref(false)
const runtime = ref<ShipRuntimeStatus | null>(null)
const speedSeries = ref<number[]>([])
const chartEl = ref<HTMLElement>()
const { setOption } = useChart(chartEl)

const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))

async function load() {
  if (props.ship?.id == null) return
  loading.value = true
  try {
    const rt = await getRuntimeByShip(props.ship.id)
    runtime.value = rt && typeof rt === 'object' ? rt : null
    if (rt?.speed != null) {
      speedSeries.value = [...speedSeries.value.slice(-59), rt.speed]
      renderChart()
    }
  } catch {
    runtime.value = null
  } finally {
    loading.value = false
  }
}

function renderChart() {
  void nextTick(() => {
    setOption({
      grid: { left: 34, right: 10, top: 18, bottom: 22 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: speedSeries.value.map((_, i) => `#${i + 1}`),
        axisLine: { lineStyle: { color: chartTheme.axisLine } },
        axisLabel: { color: chartTheme.textStyle.color, fontSize: 9 },
      },
      yAxis: {
        type: 'value',
        name: 'kn',
        axisLine: { lineStyle: { color: chartTheme.axisLine } },
        axisLabel: { color: chartTheme.textStyle.color, fontSize: 9 },
        splitLine: { lineStyle: { color: chartTheme.splitLine } },
      },
      series: [{
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: speedSeries.value,
        lineStyle: { color: '#38bdf8', width: 2 },
        areaStyle: { color: 'rgba(56,189,248,0.12)' },
      }],
    })
  })
}

watch(() => props.ship?.id, () => {
  speedSeries.value = []
  void load()
}, { immediate: true })

defineExpose({ reload: load })
</script>

<style scoped>
.ship-detail { padding: 16px 18px; border-radius: 14px; }
.sd-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.sd-avatar { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #e0f2fe; background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(124, 58, 237, 0.3)); border: 1px solid rgba(125, 211, 252, 0.3); }
.sd-title-wrap { flex: 1; min-width: 0; }
.sd-name { margin: 0; font-size: 17px; font-weight: 800; color: #f1f5f9; }
.sd-sub { font-size: 11.5px; color: #64748b; }
.sd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.sd-item { background: rgba(13, 31, 49, 0.55); border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 10px; padding: 8px 10px; }
.sd-item em { display: block; font-style: normal; font-size: 10.5px; color: #64748b; margin-bottom: 3px; }
.sd-item b { font-size: 12.5px; color: #e2e8f0; font-weight: 600; word-break: break-all; }
.sd-runtime { margin-top: 14px; }
.sd-chart { margin-top: 14px; }
.sc-title { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.sc-canvas { height: 150px; }
</style>
