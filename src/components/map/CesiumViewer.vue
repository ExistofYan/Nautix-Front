<template>
  <div class="chart-stage">
    <svg
      class="chart-svg"
      :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 底图：海洋渐变 + 经纬网格 -->
      <defs>
        <linearGradient id="ocean-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#081426" />
          <stop offset="55%" stop-color="#0a1b33" />
          <stop offset="100%" stop-color="#071223" />
        </linearGradient>
      </defs>
      <rect :width="VIEW_W" :height="VIEW_H" fill="url(#ocean-grad)" />
      <g stroke="rgba(56,189,248,0.10)" stroke-width="0.6">
        <line v-for="i in 10" :key="'v' + i" :x1="(i - 1) * (VIEW_W / 10)" y1="0" :x2="(i - 1) * (VIEW_W / 10)" :y2="VIEW_H" />
        <line v-for="i in 6" :key="'h' + i" x1="0" :y1="(i - 1) * (VIEW_H / 6)" :x2="VIEW_W" :y2="(i - 1) * (VIEW_H / 6)" />
      </g>

      <!-- ================= 图层组件（z-order：海洋→天气→航线→港口→交通→热力→告警→船舶） ================= -->
      <OceanLayer v-if="visible.ocean" :bounds="bounds" />
      <g v-if="visible.weather">
        <WeatherLayer :bounds="bounds" :regions="data.weather" :show-wind="false" :show-wave="false" />
        <WindLayer :regions="data.weather" />
        <WaveLayer :regions="data.weather" />
        <PressureLayer :regions="data.weather" />
        <TemperatureLayer :regions="data.weather" />
      </g>
      <RouteLayer
        v-if="visible.route"
        :bounds="bounds"
        :routes="layerRoutes"
        :active="null"
      />
      <PortLayer
        v-if="visible.port"
        :bounds="bounds"
        :ports="data.ports"
        :show-labels="true"
      />
      <TrafficLayer v-if="visible.traffic" :bounds="bounds" :runtime="data.runtime" />
      <HeatmapLayer v-if="visible.heatmap" :bounds="bounds" :points="heatPoints" />
      <AlertLayer
        v-if="visible.alert"
        :bounds="bounds"
        :runtime="data.runtime"
        :alerts="pendingAlerts"
      />
      <ShipLayer
        v-if="visible.ship"
        :bounds="bounds"
        :runtime="data.runtime"
        @select="onLayerSelect"
        @hover="(id: number | null) => (hover = id)"
      />

      <!-- hover tooltip -->
      <g v-if="hoverMark" :transform="`translate(${hoverMark.x},${hoverMark.y})`">
        <rect x="8" y="-26" width="132" height="24" rx="6" fill="rgba(13,26,51,0.92)" stroke="rgba(56,189,248,0.35)" />
        <text x="16" y="-10" font-size="10" fill="#e2e8f0">{{ hoverMark.text }}</text>
      </g>
    </svg>

    <!-- 右上角：工具条 + 图层管理 -->
    <div class="cv-tools">
      <MapToolbar :loading="loading" @zoom="(f: number) => viewerApi.zoomBy(f)" @fit="viewerApi.fitAll()" @refresh="reloadAll" />
      <LayerManager v-model:visible="visible" />
    </div>
    <!-- 左下角：图例 -->
    <div class="cv-legend"><MapLegend /></div>

    <!-- 点击船弹层 -->
    <ShipPopup
      v-if="popupShip"
      :ship="popupShip"
      @close="popupShip = null"
      @detail="(s: ShipInfo) => { popupShip = null; openReplayFor(s) }"
    />

    <!-- 选中船的小窗轨迹回放 -->
    <div v-if="replayShipId != null" class="cv-replay nx-panel">
      <div class="cv-replay-head">
        <span>单船轨迹采样 · {{ shipById.get(replayShipId)?.shipName ?? replayShipId }}</span>
        <el-button size="small" text @click="closeReplay">关闭</el-button>
      </div>
      <ShipReplay :ship-id="replayShipId" />
    </div>

    <!-- 比例尺 -->
    <div class="scale-bar">
      <span class="scale-line"></span>
      <em>{{ scaleLabel }}</em>
    </div>

    <div v-if="loading" class="mask">
      <el-icon class="is-loading" :size="26"><Loading /></el-icon>
      <span>海图数据加载中…</span>
    </div>
    <div v-else-if="emptyAll" class="mask mask-empty">
      <el-empty :image-size="70" description="暂无海图数据 — 请确认后端服务已启动" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 海图查看器（原 CesiumViewer 占位实现的重写版）。
 * 对外契约保持不变：无 props；emit ready(viewerApi)、shipSelected(ship|null)。
 * 内部为纯 SVG 投影渲染，不依赖 cesium 库。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { VIEW_W, VIEW_H } from '@/types/map'
import type { ShipInfo } from '@/api/types'
import type { RouteLayerItem } from '@/components/map/RouteLayer.vue'
import { useMapData } from '@/hooks/useMapData'
import { useMapStore } from '@/stores/map'
import { getAllAlertRecords } from '@/api/alert'
import type { AlertRecord } from '@/api/types'
import OceanLayer from '@/components/map/OceanLayer.vue'
import PortLayer from '@/components/map/PortLayer.vue'
import RouteLayer from '@/components/map/RouteLayer.vue'
import ShipLayer from '@/components/map/ShipLayer.vue'
import TrafficLayer from '@/components/map/TrafficLayer.vue'
import AlertLayer from '@/components/map/AlertLayer.vue'
import HeatmapLayer from '@/components/map/HeatmapLayer.vue'
import WeatherLayer from '@/components/map/WeatherLayer.vue'
import WindLayer from '@/components/weather/WindLayer.vue'
import WaveLayer from '@/components/weather/WaveLayer.vue'
import PressureLayer from '@/components/weather/PressureLayer.vue'
import TemperatureLayer from '@/components/weather/TemperatureLayer.vue'
import LayerManager from '@/components/map/LayerManager.vue'
import MapLegend from '@/components/map/MapLegend.vue'
import MapToolbar from '@/components/map/MapToolbar.vue'
import ShipPopup from '@/components/ship/ShipPopup.vue'
import ShipReplay from '@/components/ship/ShipReplay.vue'

const emit = defineEmits<{
  (e: 'ready', viewer: unknown): void
  (e: 'shipSelected', ship: ShipInfo | null): void
}>()

const { data, loading, visible, map, viewerApi, shipById, pointsByRoute, load } = useMapData()

const mapStore = useMapStore()
const pendingAlerts = ref<AlertRecord[]>([])
const popupShip = ref<ShipInfo | null>(null)
const replayShipId = ref<number | null>(null)

/** 与内联渲染共用的视口边界 */
const bounds = computed(() => map.bounds())

/** RouteLayer 组件入参：按 routeId 分组的有序点位 */
const layerRoutes = computed<RouteLayerItem[]>(() => {
  const out: RouteLayerItem[] = []
  for (const [routeId, pts] of pointsByRoute.value) {
    out.push({ id: routeId, name: `#${routeId}`, points: pts })
  }
  return out
})

/** HeatmapLayer 入参：船位聚合为 LonLat 点 */
const heatPoints = computed(() =>
  data.runtime
    .filter((r) => r.longitude != null && r.latitude != null)
    .map((r) => ({ longitude: r.longitude as number, latitude: r.latitude as number })),
)

async function loadAlerts() {
  try {
    const list = await getAllAlertRecords()
    pendingAlerts.value = Array.isArray(list) ? list.filter((a) => a.handleStatus !== 1).slice(0, 40) : []
  } catch {
    pendingAlerts.value = []
  }
}

function onLayerSelect(shipId: number) {
  pickShip(shipId)
}

function closeReplay() {
  replayShipId.value = null
}

const hover = ref<number | null>(null)
let timer: number | undefined


const project = computed(() => map.project())



const shipMarks = computed(() => {
  const proj = project.value
  return data.runtime
    .filter((r) => r.longitude != null && r.latitude != null)
    .map((r) => {
      const q = proj({ longitude: r.longitude as number, latitude: r.latitude as number })
      const info = r.shipId != null ? shipById.value.get(r.shipId) : undefined
      const st = (r.sailingStatus ?? '').toUpperCase()
      const color = st.includes('ANCHOR') || st.includes('停') ? '#fbbf24' : st.includes('靠泊') || st.includes('BERTH') ? '#a78bfa' : '#34d399'
      return { shipId: r.shipId ?? -1, x: q.x, y: q.y, heading: r.heading ?? 0, color, name: info?.shipName ?? `船-${r.shipId}` }
    })
})

const hoverMark = computed(() => {
  if (hover.value == null) return null
  const m = shipMarks.value.find((s) => s.shipId === hover.value)
  if (!m) return null
  const rt = data.runtime.find((r) => r.shipId === hover.value)
  return {
    x: m.x,
    y: m.y,
    text: `${m.name} · ${rt?.speed != null ? rt.speed.toFixed(1) : '--'} kn`,
  }
})

const scaleLabel = computed(() => {
  const b = map.bounds()
  const degPerPx = (b.maxLon - b.minLon) / VIEW_W
  const nm = degPerPx * 120 * 60 // 1°≈60nmi：120px 经度差换算为海里
  return nm >= 60 ? `${Math.round(nm)} nmi` : `${nm.toFixed(1)} nmi`
})

const emptyAll = computed(
  () => data.runtime.length === 0 && data.points.length === 0 && data.ports.length === 0,
)

function pickShip(shipId: number) {
  const ship = shipById.value.get(shipId) ?? null
  popupShip.value = ship
  emit('shipSelected', ship)
}

function openReplayFor(ship: ShipInfo) {
  if (ship.id != null) replayShipId.value = ship.id
}

function reloadAll() {
  void load()
  void loadAlerts()
  mapStore.setCenter(0, 0)
}

onMounted(() => {
  reloadAll()
  emit('ready', viewerApi)
  timer = window.setInterval(() => { void load() }, 15000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.cv-tools {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  z-index: 5;
}
.cv-legend {
  position: absolute;
  left: 12px;
  bottom: 34px;
  z-index: 5;
}
.cv-replay {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 300px;
  z-index: 6;
  padding: 10px 12px;
  border-radius: 12px;
}
.cv-replay-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--nx-text-dim, #a8bdd9);
  margin-bottom: 6px;
}
.chart-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  border-radius: 14px;
  background: #071223;
}
.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.ship-hit {
  cursor: pointer;
  transition: filter 0.15s ease;
}
.ship-hit:hover {
  filter: drop-shadow(0 0 6px rgba(125, 211, 252, 0.9));
}
.scale-bar {
  position: absolute;
  left: 14px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--nx-text-dim, #a8bdd9);
  font-size: 11px;
}
.scale-line {
  width: 120px;
  height: 4px;
  border-left: 1px solid currentColor;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
}
.mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94a3b8;
  background: rgba(7, 18, 35, 0.55);
  backdrop-filter: blur(2px);
}
.mask-empty {
  background: transparent;
  backdrop-filter: none;
}
</style>
