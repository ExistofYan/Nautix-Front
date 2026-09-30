"""最终集成接线脚本：幂等、只增不删。运行后报告每个文件动作。"""
import io, os, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def rd(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()

def wr(p, t):
    with open(os.path.join(SRC, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(t)

log = []

# ---------- 1. views/replay/ReplayPlayer.vue（占位壳 → 整页工作台） ----------
wr('views/replay/ReplayPlayer.vue', '''<template>
  <div class="nx-page rp-full">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">回放工作台</h2>
        <p class="nx-page-desc">航线选择 + 海图回放 + 播放控制 + 传感器联动，一屏完成</p>
      </div>
      <el-tag effect="dark" round type="info">{{ routeName || '未选航线' }}</el-tag>
    </div>

    <div class="rp-grid">
      <GlassPanel title="航迹回放" class="rp-main">
        <ReplayPlayer :route-id="routeId" @change-route="onRouteChange" />
      </GlassPanel>
      <div class="rp-side">
        <GlassPanel title="当前帧">
          <ReplayPanel />
        </GlassPanel>
        <GlassPanel title="传感器游标">
          <ReplayChart :data="trend" :cursor-index="frameIndex" title="近 60 条读数" />
        </GlassPanel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 整页回放工作台：复用 components/replay 三件套，
 * 数据走 stores/replay（航线点位）+ /sensorData/trend（联动曲线）。
 */
import { computed, onMounted, ref } from 'vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import ReplayPlayer from '@/components/replay/ReplayPlayer.vue'
import ReplayPanel from '@/components/replay/ReplayPanel.vue'
import ReplayChart from '@/components/replay/ReplayChart.vue'
import { useReplayStore } from '@/stores/replay'
import { getSensorTrendData } from '@/api/sensor'
import type { SensorData } from '@/api/types'

const store = useReplayStore()
const routeId = ref<number>()
const routeName = ref('')
const trend = ref<SensorData[]>([])

const frameIndex = computed(() => store.currentIndex)

function onRouteChange(id: number, name?: string) {
  routeId.value = id
  routeName.value = name ?? ''
}

onMounted(async () => {
  try {
    trend.value = await getSensorTrendData(60)
  } catch {
    trend.value = []
  }
})
</script>

<style scoped>
.rp-full { display: flex; flex-direction: column; gap: 14px; }
.rp-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; align-items: start; }
.rp-main { min-width: 0; }
.rp-side { display: flex; flex-direction: column; gap: 14px; }
@media (max-width: 1100px) {
  .rp-grid { grid-template-columns: 1fr; }
}
</style>
''')
log.append('rewrite views/replay/ReplayPlayer.vue (shell -> full workbench page)')

# ---------- 2. CesiumViewer：图层组件化 + 船舶弹窗/回放小窗 + map store ----------
cv = rd('components/map/CesiumViewer.vue')

if "OceanLayer" not in cv:
    # 2a. imports & state
    old_head = """import { computed, onMounted, onUnmounted, ref } from 'vue'
import { VIEW_W, VIEW_H } from '@/types/map'
import type { ShipInfo } from '@/api/types'
import { useMapData } from '@/hooks/useMapData'"""
    new_head = """import { computed, onMounted, onUnmounted, ref } from 'vue'
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
import ShipReplay from '@/components/ship/ShipReplay.vue'"""
    assert old_head in cv, 'CesiumViewer head import block not found'
    cv = cv.replace(old_head, new_head)

    # 2b. script helpers after useMapData destructure
    old_destr = "const { data, loading, visible, map, viewerApi, shipById, pointsByRoute, load } = useMapData()"
    new_destr = old_destr + """

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

function openReplay() {
  if (popupShip.value?.id != null) replayShipId.value = popupShip.value.id
}

function closeReplay() {
  replayShipId.value = null
}"""
    assert old_destr in cv, 'destructure line not found'
    cv = cv.replace(old_destr, new_destr)

    # 2c. template: replace inline layers with components
    old_layers = """      <!-- 鑸嚎鍥惧眰 -->
      <g v-if="visible.route">
        <polyline
          v-for="r in routeLines"
          :key="'rt' + r.id"
          :points="r.dots"
          fill="none"
          :stroke="r.color"
          stroke-width="1.4"
          stroke-opacity="0.75"
          stroke-linejoin="round"
          stroke-dasharray="6 3"
        />
      </g>"""
    if old_layers not in cv:
        # fallback regex on the three inline <g v-if> blocks between defs end and hover tooltip
        pat = re.compile(r"\n      <!-- [^\n]*-->\n      <g v-if=\"visible\.route\">[\s\S]*?<!-- [^\n]*-->\n      <g v-if=\"visible\.port\">[\s\S]*?<!-- [^\n]*-->\n      <g v-if=\"visible\.ship\">[\s\S]*?</g>\n", re.M)
        m = pat.search(cv)
        assert m, 'inline layers block not found (both exact & regex)'
        repl = """
      <!-- ================= 图层组件（z-order：海洋→天气→航线→港口→交通→热力→告警→船舶） ================= -->
      <OceanLayer v-if="visible.ocean" :bounds="bounds" />
      <g v-if="visible.weather">
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
"""
        cv = pat.sub(repl, cv, count=1)
    else:
        cv = cv.replace(old_layers, """      <!-- ================= 图层组件（z-order：海洋→天气→航线→港口→交通→热力→告警→船舶） ================= -->
      <OceanLayer v-if="visible.ocean" :bounds="bounds" />
      <g v-if="visible.weather">
        <WindLayer :regions="data.weather" />
        <WaveLayer :regions="data.weather" />
        <PressureLayer :regions="data.weather" />
        <TemperatureLayer :regions="data.weather" />
      </g>
      <RouteLayer v-if="visible.route" :bounds="bounds" :routes="layerRoutes" :active="null" />
      <PortLayer v-if="visible.port" :bounds="bounds" :ports="data.ports" :show-labels="true" />
      <TrafficLayer v-if="visible.traffic" :bounds="bounds" :runtime="data.runtime" />
      <HeatmapLayer v-if="visible.heatmap" :bounds="bounds" :points="heatPoints" />
      <AlertLayer v-if="visible.alert" :bounds="bounds" :runtime="data.runtime" :alerts="pendingAlerts" />
      <ShipLayer v-if="visible.ship" :bounds="bounds" :runtime="data.runtime" @select="onLayerSelect" @hover="(id: number | null) => (hover = id)" />""")

    # 2d. remove now-dead inline port/ship groups if still present (the port/ship <g> blocks)
    dead_port = re.compile(r"\n      <!-- [^\n]*-->\n      <g v-if=\"visible\.port\">[\s\S]*?</g>\n(?=\s*\n)", re.M)
    # safer: only remove specific known inline blocks by their unique content markers
    for marker_re in [
        re.compile(r"\n      <!-- \S* -->\n      <g v-if=\"visible\.port\">\n        <g v-for=\"\(p, i\) in portMarks\"[\s\S]*?</g>\n      </g>\n"),
        re.compile(r"\n      <!-- \S* -->\n      <g v-if=\"visible\.ship\">\n        <g\n          v-for=\"\(s, i\) in shipMarks\"[\s\S]*?</g>\n      </g>\n"),
    ]:
        cv = marker_re.sub("\n", cv, count=1)

    # 2e. drop unused computeds that referenced removed markup (keep code clean, noUnusedLocals)
    for name in ['routeLines', 'portMarks']:
        pat2 = re.compile(r"\nconst " + name + r" = computed\(\(\) => \{[\s\S]*?\n\}\)\n")
        if pat2.search(cv) and ('{{ p.name }}' not in cv.split('<script')[0]) and (name + '.value') not in cv:
            cv = pat2.sub('\n', cv, count=1)

    # 2f. overlays before closing chart-stage div: toolbar/legend/manager/popup/replay
    anchor = '    </svg>'
    assert anchor in cv
    overlays = """    </svg>

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
    </div>"""
    cv = cv.replace(anchor, overlays, 1)

    # 2g. extend pickShip to also show popup; add reloadAll/openReplayFor; hook alerts into mount
    cv = cv.replace("""function pickShip(shipId: number) {
  const ship = shipById.value.get(shipId) ?? null
  emit('shipSelected', ship)
}""", """function pickShip(shipId: number) {
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
}""")

    cv = cv.replace("""onMounted(() => {
  void load()
  emit('ready', viewerApi)
  timer = window.setInterval(() => { void load() }, 15000)
})""", """onMounted(() => {
  reloadAll()
  emit('ready', viewerApi)
  timer = window.setInterval(() => { void load() }, 15000)
})""")

    # 2h. styles for overlays
    style_anchor = '.chart-stage {'
    extra_css = """.cv-tools {
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
.chart-stage {"""
    cv = cv.replace(style_anchor, extra_css, 1)

    wr('components/map/CesiumViewer.vue', cv)
    log.append('edit CesiumViewer.vue: mount 12 layer comps + toolbar/legend/LayerManager + ShipPopup + ShipReplay + useMapStore + alerts')
else:
    log.append('skip CesiumViewer.vue (already layered)')

# ---------- 3. router：补 /replay/player、/workspace；MainLayout 菜单 ----------
rt = rd('router/index.ts')
if 'views/workspace/ClassicWorkspace.vue' not in rt:
    ws_block = """    {
      path: '/workspace',
      name: 'workspace',
      component: () => import('@/views/workspace/ClassicWorkspace.vue'),
      meta: { title: 'Classic Workspace', titleZh: '效率工作台' },
    },
    {
      path: '/replay/player',
      name: 'replay-player',
      component: () => import('@/views/replay/ReplayPlayer.vue'),
      meta: { title: 'Replay Workbench', titleZh: '回放工作台' },
    },
    {
      path: '/replay/route/:id',
      name: 'replay-route-id',
      component: () => import('@/views/replay/RouteReplay.vue'),
      meta: { title: 'Route Replay Detail', titleZh: '航线回放详情' },
    },
"""
    anchor = "    {\n      path: '/replay',"
    assert anchor in rt, 'replay route anchor missing'
    rt = rt.replace(anchor, ws_block + anchor, 1)
    wr('router/index.ts', rt)
    log.append('edit router/index.ts: +/workspace +/replay/player +/replay/route/:id')
else:
    log.append('skip router (workspace already wired)')

ml = rd('layouts/MainLayout.vue')
if '/workspace' not in ml:
    old_item = """          <el-menu-item index="/system/logs">"""
    new_item = """          <el-menu-item index="/workspace">
            <el-icon><Grid /></el-icon>
            <template #title>效率工作台</template>
          </el-menu-item>

          <el-menu-item index="/system/logs">"""
    assert old_item in ml
    ml = ml.replace(old_item, new_item, 1)
    wr('layouts/MainLayout.vue', ml)
    log.append('edit MainLayout.vue: +效率工作台 menu item')
else:
    log.append('skip MainLayout (menu present)')

print('\n'.join(log))
print('PART-A DONE')
