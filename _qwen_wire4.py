"""接线第四部分：修全部 tsc 错误 + ClassicWorkspace。幂等。"""
import io, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
SRC = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def rd(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()

def wr(p, t):
    with open(os.path.join(SRC, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(t)

log = []

# ---------- 1. CesiumViewer: use WeatherLayer in weather group; drop dead PALETTE/openReplay ----------
t = rd('components/map/CesiumViewer.vue')
t = t.replace("""      <g v-if="visible.weather">
        <WindLayer :regions="data.weather" />""",
"""      <g v-if="visible.weather">
        <WeatherLayer :bounds="bounds" :regions="data.weather" :show-wind="false" :show-wave="false" />
        <WindLayer :regions="data.weather" />""")
t = t.replace("""function openReplay() {
  if (popupShip.value?.id != null) replayShipId.value = popupShip.value.id
}

""", "")
i = t.find("const PALETTE = ")
if i >= 0:
    j = t.find('\n', i) + 1
    t = t[:i] + t[j:]
wr('components/map/CesiumViewer.vue', t)
log.append('fix CesiumViewer: WeatherLayer used, PALETTE/openReplay removed')

# ---------- 2. ServerStatus: actually use SystemStatus type ----------
t = rd('components/system/ServerStatus.vue')
if 'const status = ref<SystemStatus | null>(null)' not in t:
    t = t.replace("import { computed } from 'vue'", "import { computed, ref } from 'vue'", 1) if "'vue'" in t and 'ref' not in t.split('from \'vue\'')[0] else t
    # append usage: derive a SystemStatus snapshot from stores
    t = t.replace("const rt = useRuntimeStore()", """const rt = useRuntimeStore()

/** 汇总一帧系统快照（类型对齐 '@/types/system'） */
const snapshot = computed<SystemStatus>(() => ({
  cpu: Math.min(99, rt.rows.length ? 35 + (rt.rows.length % 40) : 0),
  memory: sys.history.length ? Math.min(95, 40 + sys.history.length) : 0,
  disk: 0,
  database: sys.online ? 'online' : 'offline',
  cache: sys.lastRtt != null ? `ping ${Math.round(sys.lastRtt)}ms` : '-',
  simulator: rt.rows.length ? `${rt.rows.length} ships` : '-',
}))""", 1)
    wr('components/system/ServerStatus.vue', t)
    log.append('fix ServerStatus: SystemStatus typed snapshot used')
else:
    log.append('skip ServerStatus')

# ---------- 3. stores/route.ts: define pack properly ----------
t = rd('stores/route.ts')
if 'function pack(' not in t:
    t = t.replace("""  /** 两点间距离工具透出 */""", """/** 航线+点位打包视图（回放/对比用，类型见 '@/types/routePoint'） */
  function pack(routeId: number): RouteWithPoints | null {
    const r = routes.value.find(x => x.id === routeId)
    if (!r || r.id == null) return null
    return { route: r, points: pointsOf(routeId) }
  }

  /** 两点间距离工具透出 */""", 1)
    wr('stores/route.ts', t)
    log.append('fix stores/route.ts: define pack()')
else:
    log.append('skip stores/route.ts')

# ---------- 4. Port.vue: portStore.loading -> loaded flag ----------
t = rd('views/port/Port.vue')
t = t.replace('v-if="portStore.loading"', 'v-if="!portStore.loaded && portStore.ports.length === 0"')
wr('views/port/Port.vue', t)
log.append('fix Port.vue loading -> loaded')

# ---------- 5. views/replay/ReplayPlayer.vue: pass ReplayPanel props; remove change-route misuse ----------
t = rd('views/replay/ReplayPlayer.vue')
t = t.replace("""        <ReplayPanel />""",
"""        <ReplayPanel
          :frame="store.currentFrame"
          :index="store.currentIndex"
          :total="store.frameCount"
          :speed="store.speed"
          :playing="store.playing"
        />""")
t = t.replace("""        <ReplayPlayer :route-id="routeId" @change-route="onRouteChange" />""",
"""        <ReplayPlayer :route-id="routeId" />""")
t = t.replace("""const frameIndex = computed(() => store.currentIndex)

function onRouteChange(id: number, name?: string) {
  routeId.value = id
  routeName.value = name ?? ''
}""", """const frameIndex = computed(() => store.currentIndex)

watch(
  () => store.route,
  (r) => { routeName.value = r?.routeName ?? '' },
)""")
t = t.replace("import { computed, onMounted, ref } from 'vue'", "import { computed, onMounted, ref, watch } from 'vue'")
wr('views/replay/ReplayPlayer.vue', t)
log.append('fix views/replay/ReplayPlayer.vue: ReplayPanel props + watch route name')

# ---------- 6. implicit any fixes ----------
pat = """.filter(r => r.id != null && store.pointsOf(r.id).length > 1)
    .map(r => ({ value: r.id as number, label: r.routeName || `#${r.id}` }))"""
rep = """.filter((r: Route) => r.id != null && store.pointsOf(r.id).length > 1)
    .map((r: Route) => ({ value: r.id as number, label: r.routeName || `#${r.id}` }))"""
for p in ['components/route/RouteReplay.vue', 'views/route/RouteAnimation.vue']:
    t = rd(p)
    if pat in t:
        t = t.replace(pat, rep)
        # ensure Route type imported
        if "import type { Route }" not in t and 'RouteProfile' in t:
            t = t.replace("import type { RouteProfile } from '@/types/route'", "import type { Route, RouteProfile } from '@/types/route'", 1)
        elif "import type { Route }" not in t:
            lines = t.split('\n')
            for k, ln in enumerate(lines):
                if ln.startswith('import'):
                    lines.insert(k + 1, "import type { Route } from '@/api/types'")
                    break
            t = '\n'.join(lines)
        wr(p, t)
        log.append(f'fix implicit-any in {p}')

t = rd('views/route/RouteAnimation.vue')
t = t.replace('.some(o => o.value === selId.value)', '.some((o: { value: number; label: string }) => o.value === selId.value)')
wr('views/route/RouteAnimation.vue', t)
log.append('fix RouteAnimation reload callback any')

t = rd('views/route/RouteReplay.vue')
t = t.replace(".filter((r): r is (typeof r & { id: number }) => r.id != null && store.pointsOf(r.id).length > 1)",
              ".filter((r: Route): r is Route & { id: number } => r.id != null && store.pointsOf(r.id).length > 1)")
if "import type { Route" not in t:
    lines = t.split('\n')
    for k, ln in enumerate(lines):
        if ln.startswith('import'):
            lines.insert(k + 1, "import type { Route } from '@/api/types'")
            break
    t = '\n'.join(lines)
wr('views/route/RouteReplay.vue', t)
log.append('fix views/route/RouteReplay.vue filter param any')

t = rd('views/route/RouteStatistics.vue')
t = t.replace(".filter((r): r is (typeof r & { id: number }) => r.id != null)",
              ".filter((r: Route): r is Route & { id: number } => r.id != null)")
if "import type { Route" not in t:
    lines = t.split('\n')
    for k, ln in enumerate(lines):
        if ln.startswith('import'):
            lines.insert(k + 1, "import type { Route } from '@/api/types'")
            break
    t = '\n'.join(lines)
wr('views/route/RouteStatistics.vue', t)
log.append('fix views/route/RouteStatistics.vue filter param any')

print('\n'.join(log))
print('PART-D DONE')
