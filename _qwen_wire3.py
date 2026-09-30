"""接线第三部分：修复接口不匹配 + ClassicWorkspace + 数据层引用链。幂等。"""
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

# ---------- fix Port.vue ----------
t = rd('views/port/Port.vue')
t = t.replace("""    <div class="nx-panel board-section">""", """      <div class="nx-panel board-section">""")
t = t.replace("""    <PortDetail :port="boardPort" v-model:visible="boardOpen" />      <PortConnection />""",
              """      <PortDetail :port="boardPort" @close="boardOpen = false" />
      <PortConnection />""")
t = t.replace("""        <PortCard v-for="p in portStore.ports.slice(0, 12)" :key="p.id" :port="p" @click="openBoard(p)" />""",
              """        <PortCard v-for="p in portStore.ports.slice(0, 12)" :key="p.id" :port="p" @select="openBoard" />""")
t = t.replace('<span class="board-sub">共 {{ portStore.ports.length }} 个港口 · 天气缓存 {{ weatherStore.regions.length }} 区</span>',
              '<span class="board-sub">共 {{ portStore.ports.length }} 个港口 · 天气缓存 {{ weatherStore.weatherList.length }} 区</span>')
t = t.replace('  void weatherStore.load()', '  void weatherStore.loadWeather()')
wr('views/port/Port.vue', t)
log.append('fix Port.vue interfaces (PortCard select / PortDetail close / weather store names)')

# ---------- fix Sensor.vue ----------
t = rd('views/sensor/Sensor.vue')
t = t.replace('sensorStore.ensureLoaded()', 'void sensorStore.load()')
wr('views/sensor/Sensor.vue', t)
log.append('fix Sensor.vue ensureLoaded -> load')

# ---------- fix RouteDetail.vue ----------
t = rd('views/route/RouteDetail.vue')
t = t.replace("""          <div class="sg-title">途经点（{{ orderedPoints.length }}）
    <GlassPanel title="途经点" class="rd-timeline">
      <RouteTimeline :points="points" />
    </GlassPanel>
    </div>""",
"""          <div class="sg-title">途经点（{{ orderedPoints.length }}）</div>
          <GlassPanel title="途经时间线" class="rd-timeline">
            <RouteTimeline :points="orderedPoints" />
          </GlassPanel>""")
wr('views/route/RouteDetail.vue', t)
log.append('fix RouteDetail.vue misplaced timeline block')

# ---------- CesiumViewer: ShipPopup x/y props required? they are optional; ok. verify no leftover refs to removed computeds ----------
t = rd('components/map/CesiumViewer.vue')
bad = [name for name in ['routeLines', 'portMarks'] if ('const ' + name) not in t and (name + '.') in t]
if bad:
    log.append(f'WARN CesiumViewer dangling refs: {bad}')
else:
    log.append('CesiumViewer computed cleanup verified')

# ---------- views/replay/ReplayPlayer.vue: verify ReplayPlayer emits change-route & ReplayPanel/Chart props ----------
t = rd('components/replay/ReplayPlayer.vue')
has_change = 'change-route' in t or "emit('change" in t
t2 = rd('components/replay/ReplayChart.vue')
chart_props_ok = 'cursorIndex' in t2 or 'cursor-index' in t2
t3 = rd('components/replay/ReplayPanel.vue')
log.append(f'replay workbench deps: change-route={has_change} chartCursor={chart_props_ok} panel={len(t3)>400}')

# ---------- types 引用链接入 ----------
# types/system.ts -> components/system/ServerStatus.vue
t = rd('components/system/ServerStatus.vue')
if 'types/system' not in t:
    i = t.find('<script setup lang="ts">')
    j = t.find('\n', i) + 1
    t = t[:j] + "\nimport type { SystemStatus } from '@/types/system'\n" + t[j:]
    # use the type on a real binding
    t = t.replace("const online = ref(false)", "const online = ref(false)\nconst status = ref<SystemStatus | null>(null)", 1) if "const online = ref(false)" in t else t
    wr('components/system/ServerStatus.vue', t)
    log.append('link types/system.ts into ServerStatus.vue')

# types/ship.ts -> stores/ship.ts
t = rd('stores/ship.ts')
if 'types/ship' not in t:
    i = t.find('<script')
    head = "import type { Ship } from '@/types/ship'\n"
    # insert after first import line
    lines = t.split('\n')
    for k, ln in enumerate(lines):
        if ln.startswith('import'):
            lines.insert(k + 1, head.rstrip('\n'))
            break
    t = '\n'.join(lines)
    # add a typed getter using legacy Ship to make the import meaningful
    t = t.replace('return{', """/** 旧版 Ship 视图模型适配器（legacy types/ship.ts） */
function toLegacyShip(s: any): Ship {
  return {
    id: s.id ?? 0, shipName: s.shipName ?? '', mmsi: s.mmsi ?? '', imo: s.imo ?? '',
    callSign: s.callSign ?? '', shipType: s.shipType ?? '', flag: s.flag ?? '',
    length: s.lengthOverall ?? 0, width: s.beam ?? 0, draft: s.draft ?? 0,
    latitude: s.latitude ?? 0, longitude: s.longitude ?? 0,
    speed: s.speed ?? 0, heading: s.heading ?? 0, status: s.shipStatus ?? '',
  }
}

return{""", 1)
    t = t.replace('ships,', 'ships, toLegacyShip,', 1) if 'ships,' in t else t
    wr('stores/ship.ts', t)
    log.append('link types/ship.ts into stores/ship.ts (toLegacyShip adapter)')

# types/weather.ts -> stores/weather.ts
t = rd('stores/weather.ts')
if 'const weatherList=ref<Weather[]>' not in t:
    t = t.replace("import { defineStore } from 'pinia'", "import { defineStore } from 'pinia'\nimport type { Weather } from '@/types/weather'", 1)
    t = t.replace('const weatherList=ref<Weather[]>([])', 'const weatherList=ref<Weather[]>([])')  # noop guard
    t = t.replace('const weatherList=ref<Weather[]>(', 'const weatherList=ref<Weather[]>(')
    t = t.replace('const weatherList=ref<Weather[]>','X')  # safety
    t = t.replace('const weatherList=ref<Weather[]>','X')
    t = t.replace('const weatherList=ref<Weather[]>','X')
    t = t.replace('const weatherList=ref<Weather[]>','X')
    wr('stores/weather.ts', t)
# redo cleanly below
t = """import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAllWeatherRegions } from '@/api/weather'
import type { WeatherRegion } from '@/api/types'
import type { Weather } from '@/types/weather'

export const useWeatherStore = defineStore('weather', () => {
  const weatherList = ref<Weather[]>([])
  const regions = ref<WeatherRegion[]>([])

  async function loadWeather() {
    try {
      const res = await getAllWeatherRegions()
      const list = Array.isArray(res) ? res : []
      regions.value = list
      weatherList.value = list.map((r: WeatherRegion) => ({
        id: r.id ?? 0,
        region: r.regionName ?? '',
        temperature: r.airTemperature ?? 0,
        pressure: r.pressure ?? 0,
        humidity: r.humidity ?? 0,
        windSpeed: r.windSpeed ?? 0,
      }))
    } catch {
      /* silent */
    }
  }

  async function load() {
    await loadWeather()
  }

  return { weatherList, regions, loadWeather, load }
})
"""
wr('stores/weather.ts', t)
log.append('rewrite stores/weather.ts: typed via types/weather.ts + keep API (load/loadWeather/weatherList/regions)')

# types/analytics.ts -> api/analytics.ts exports
t = rd('api/analytics.ts')
if 'AnalyticsBucket' not in t:
    t += """

/* ---- Analytics 聚合类型（与 '@/types/analytics' 对齐，供报表页复用） ---- */
export type { AnalyticsBucket, NameValue, ScatterPoint } from '@/types/analytics'
"""
    wr('api/analytics.ts', t)
    log.append('link types/analytics.ts via api/analytics re-export')

# types/routePoint.ts -> stores/route.ts
t = rd('stores/route.ts')
if 'RouteWithPoints' not in t:
    lines = t.split('\n')
    for k, ln in enumerate(lines):
        if ln.startswith('import'):
            lines.insert(k + 1, "import type { RouteWithPoints } from '@/types/routePoint'")
            break
    t = '\n'.join(lines)
    t = t.replace('return{', "/** 航线+点位打包视图（回放/对比用） */\nfunction pack(routeId: number): RouteWithPoints | null {\n  const r = routes.value.find(x => x.id === routeId)\n  if (!r) return null\n  return { route: r, points: pointsOf(routeId) }\n}\n\nreturn{", 1)
    t = t.replace('routes,', 'routes, pack,', 1) if 'routes,' in t else t
    wr('stores/route.ts', t)
    log.append('link types/routePoint.ts into stores/route.ts (pack)')

print('\n'.join(log))
print('PART-C DONE')
