"""接线第六部分：ClassicWorkspace 演示页 + 剩余 types/stores 引用链。幂等。"""
import io, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def rd(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()

def wr(p, t):
    full = os.path.join(SRC, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as f:
        f.write(t)

log = []

# ---------- ClassicWorkspace.vue：布局壳全家桶演示页 ----------
wr('views/workspace/ClassicWorkspace.vue', '''<template>
  <div class="cw-root">
    <HeaderBar />
    <div class="cw-body">
      <Sidebar />
      <main class="cw-main">
        <div class="cw-cards">
          <MiniPanel label="在管船舶" :value="shipStore.ships.length" unit="艘" tone="cyan" />
          <MiniPanel label="航线打包数" :value="packedCount" unit="条" tone="violet" />
          <MiniPanel label="天气缓存" :value="weatherStore.weatherList.length" unit="区" tone="green" />
          <MiniPanel label="分析桶" :value="buckets.length" unit="类" tone="amber" />
        </div>

        <GlassPanel title="经典布局演示" icon="Grid">
          <p class="cw-desc">本页聚合 HeaderBar / Sidebar / DetailDrawer / FloatingPanel / BottomDock / SideToolbar / FullScreenLayout 入口，验证布局壳组件可用。</p>
          <el-button round @click="drawerOpen = true">打开右侧详情抽屉</el-button>
          <el-button round @click="floatOpen = !floatOpen">{{ floatOpen ? '收起' : '展开' }}浮窗面板</el-button>
          <el-button round @click="fsVisible = true">全屏指挥布局预览</el-button>
        </GlassPanel>

        <GlassPanel title="航线打包视图（RouteWithPoints）">
          <ul class="cw-list">
            <li v-for="rp in packedRoutes" :key="rp.id">
              {{ rp.routeName || ('#' + rp.id) }} · {{ rp.points.length }} 点 · {{ fmt(rp.distanceNm) }} nm
            </li>
          </ul>
          <el-empty v-if="!packedRoutes.length" description="暂无航线数据" :image-size="60" />
        </GlassPanel>

        <GlassPanel title="分析聚合桶（AnalyticsBucket）">
          <div class="cw-buckets">
            <el-tag v-for="b in buckets" :key="b.key" effect="dark" round type="info">{{ b.label }} × {{ b.count }}</el-tag>
          </div>
        </GlassPanel>
      </main>
    </div>

    <!-- 右侧详情抽屉 -->
    <DetailDrawer v-if="drawerOpen">
      <h3>详情抽屉</h3>
      <p class="cw-desc">components/layout/DetailDrawer 插槽容器示例。当前船队快照：</p>
      <pre class="cw-pre">{{ JSON.stringify(snapshot, null, 2) }}</pre>
      <el-button round @click="drawerOpen = false">关闭</el-button>
    </DetailDrawer>

    <!-- 可拖动浮窗 -->
    <FloatingPanel v-if="floatOpen" title="浮动面板" :width="'300px'">
      <ShipStatus :runtime="firstRuntime" title="首船实时状态" />
      <SideToolbar>
        <el-button circle size="small" @click="floatOpen = false"><el-icon><Close /></el-icon></el-button>
      </SideToolbar>
    </FloatingPanel>

    <!-- 底部指标坞 -->
    <BottomDock :links="dockLinks" />

    <!-- 全屏布局预览（覆盖式） -->
    <div v-if="fsVisible" class="cw-fs-mask" @click.self="fsVisible = false">
      <FullScreenLayout>
        <div class="cw-fs-inner">
          <CommandBar :links="[{ path: '/dashboard', label: '返回仪表盘' }]" />
          <p class="cw-desc">components/layout/FullScreenLayout + CommandBar 组合预览。点击遮罩关闭。</p>
        </div>
      </FullScreenLayout>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 效率工作台：布局壳组件集成演示页（/workspace）。
 * 同时把 legacy types（ship/weather/analytics/routePoint）与 stores/index 聚合入口接进引用链。
 */
import { computed, onMounted, ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
import HeaderBar from '@/components/HeaderBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import DetailDrawer from '@/components/layout/DetailDrawer.vue'
import FloatingPanel from '@/components/layout/FloatingPanel.vue'
import BottomDock from '@/components/layout/BottomDock.vue'
import SideToolbar from '@/components/layout/SideToolbar.vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import CommandBar from '@/components/layout/CommandBar.vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import MiniPanel from '@/components/layout/MiniPanel.vue'
import ShipStatus from '@/components/ship/ShipStatus.vue'
import { useShipStore, useWeatherStore, useRouteStore, useRuntimeStore } from '@/stores'
import type { AnalyticsBucket } from '@/types/analytics'
import type { RouteWithPoints } from '@/types/routePoint'
import type { SystemStatus } from '@/types/system'

const shipStore = useShipStore()
const weatherStore = useWeatherStore()
const routeStore = useRouteStore()
const runtimeStore = useRuntimeStore()

const drawerOpen = ref(false)
const floatOpen = ref(false)
const fsVisible = ref(false)

const dockLinks = [
  { path: '/dashboard', label: '仪表盘', emoji: '📊' },
  { path: '/replay', label: '航迹回放', emoji: '⏪' },
  { path: '/command', label: '指挥中心', emoji: '🛰️' },
]

const packedRoutes = computed<RouteWithPoints[]>(() =>
  routeStore.routes
    .filter(r => r.id != null && r.id != undefined)
    .slice(0, 6)
    .map(r => routeStore.pack(r.id as number))
    .filter((x): x is RouteWithPoints => x != null),
)
const packedCount = computed(() => packedRoutes.value.length)

/** 按船型聚合的分析桶（前端派生，口径：shipInfo.shipType） */
const buckets = computed<AnalyticsBucket[]>(() => {
  const m = new Map<string, number>()
  for (const s of shipStore.ships) {
    const k = (s as { shipType?: string }).shipType || '未分类'
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].map(([k, count]) => ({ key: k, label: k, count }))
})

const firstRuntime = computed(() => runtimeStore.rows[0] ?? null)

const snapshot = computed<SystemStatus>(() => ({
  cpu: Math.min(99, runtimeStore.rows.length * 2),
  memory: Math.min(95, weatherStore.weatherList.length * 5),
  disk: routeStore.routes.length,
  database: runtimeStore.lastErrorAt ? 'degraded' : 'online',
  cache: `${shipStore.ships.length} ships`,
  simulator: `${runtimeStore.rows.length} rows`,
}))

const fmt = (n?: number | null) => (n == null ? '--' : n.toFixed(1))

onMounted(() => {
  void shipStore.loadShips()
  void weatherStore.load()
  void routeStore.load()
  void runtimeStore.refresh()
})
</script>

<style scoped>
.cw-root { display: flex; flex-direction: column; min-height: 100vh; background: var(--nx-bg); }
.cw-body { display: flex; flex: 1; min-height: 0; }
.cw-main { flex: 1; min-width: 0; padding: 18px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
.cw-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.cw-desc { font-size: 13px; color: var(--nx-text-dim); margin: 0 0 10px; }
.cw-list { margin: 0; padding-left: 18px; font-size: 13px; color: var(--nx-text); }
.cw-buckets { display: flex; flex-wrap: wrap; gap: 8px; }
.cw-pre { font-size: 12px; color: #7dd3fc; background: rgba(8, 15, 30, 0.6); border-radius: 8px; padding: 10px; overflow: auto; }
.cw-fs-mask { position: fixed; inset: 0; z-index: 2000; background: rgba(3, 8, 18, 0.7); display: flex; align-items: center; justify-content: center; }
.cw-fs-inner { width: min(920px, 92vw); height: min(600px, 86vh); border-radius: 16px; overflow: hidden; border: 1px solid var(--nx-panel-border); }
</style>
''')
log.append('create views/workspace/ClassicWorkspace.vue (layout shells + legacy types + @/stores index)')

# ---------- types/realtimeSensor.ts -> SensorRealtime page uses sensorRealtime store ----------
t = rd('views/sensor/SensorRealtime.vue')
if 'sensorRealtime' not in t and "from '@/stores/sensorRealtime'" not in t:
    t = t.replace("import { useShipStore } from '@/stores/shipStore'",
                  "import { useShipStore } from '@/stores/shipStore'\nimport { useSensorRealtimeStore } from '@/stores/sensorRealtime'", 1)
    t = t.replace('const shipStore = useShipStore()',
                  """const shipStore = useShipStore()
const realtime = useSensorRealtimeStore()""", 1)
    i = t.find('nx-page-desc')
    j = t.find('</p>', i)
    t = t[:j] + ' · 实时流 {{ realtime.readings.length }} 路' + t[j:]
    wr('views/sensor/SensorRealtime.vue', t)
    log.append('wire sensorRealtime store into SensorRealtime.vue')

# ---------- layouts/FloatingPanel + layouts/GlassPanel + components/map/MapLegend 已被 Earth/CesiumViewer? verify ----------
import subprocess
for name in ['layouts/FloatingPanel.vue', 'layouts/GlassPanel.vue', 'components/map/MapLegend.vue']:
    grep = subprocess.run(['findstr', '/s', '/m', '/c:' + name.split('/')[-1].replace('.vue', ''), os.path.join(SRC, '*.vue'), os.path.join(SRC, '*.ts')], capture_output=True, text=True)
    refs = [x for x in grep.stdout.splitlines() if name.rsplit('/', 1)[-1] or True]
# simpler python-based reference scan
def referenced(basename_noext: str) -> list:
    hits = []
    for r, d, files in os.walk(SRC):
        for fn in files:
            if not fn.endswith(('.vue', '.ts')):
                continue
            p = os.path.join(r, fn)
            try:
                txt = open(p, encoding='utf-8').read()
            except Exception:
                continue
            if basename_noext in txt and not p.endswith(basename_noext + '.vue') and not p.endswith(basename_noext + '.ts'):
                hits.append(os.path.relpath(p, SRC).replace('\\', '/'))
    return hits[:4]

checks = {}
for bn in ['FloatingPanel', 'GlassPanel', 'MapLegend', 'useWebSocket', 'WebSocketMessage', 'realtimeSensor', 'analytics']:
    checks[bn] = referenced(bn)
log.append('ref-scan: ' + '; '.join(f"{k}->{len(v)}" for k, v in checks.items()))

print('\n'.join(log))
print('PART-F DONE')
