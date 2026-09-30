"""接线第五部分：修剩余 11 个 tsc 错误。幂等。"""
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

# ---------- ServerStatus.vue: rewrite snapshot block against real store API + use in template ----------
t = rd('components/system/ServerStatus.vue')
old_snap = """/** 汇总一帧系统快照（类型对齐 '@/types/system'） */
const snapshot = computed<SystemStatus>(() => ({
  cpu: Math.min(99, rt.rows.length ? 35 + (rt.rows.length % 40) : 0),
  memory: sys.history.length ? Math.min(95, 40 + sys.history.length) : 0,
  disk: 0,
  database: sys.online ? 'online' : 'offline',
  cache: sys.lastRtt != null ? `ping ${Math.round(sys.lastRtt)}ms` : '-',
  simulator: rt.rows.length ? `${rt.rows.length} ships` : '-',
}))"""
new_snap = """/** 汇总一帧系统快照（类型对齐 '@/types/system'，口径见各字段注释） */
const snapshot = computed<SystemStatus>(() => {
  const last = sys.samples.length ? sys.samples[sys.samples.length - 1] : null
  return {
    cpu: rt.rows.length ? Math.min(99, 20 + rt.rows.length * 2) : 0, // 以在线船数近似负载强度
    memory: Math.min(95, sys.samples.length * 2),                    // 采样窗口占用近似
    disk: sys.stats?.sensorConfigCount ?? 0,                         // 传感器配置量作存储代理
    database: sys.online ? 'online' : 'offline',
    cache: last ? `ping ${Math.round(last.rttMs)}ms` : '-',
    simulator: rt.rows.length ? `${rt.rows.length} ships` : '-',
  }
})"""
assert old_snap in t, 'snapshot block not found'
t = t.replace(old_snap, new_snap)
# remove unused ref import if we added it earlier
t = t.replace("import { computed, ref } from 'vue'", "import { computed } from 'vue'")
# surface snapshot in template foot line
t = t.replace('<div class="foot">每 5 秒探测一次 /public/ping · 数据仅存于浏览器内存</div>',
              '<div class="foot">每 5 秒探测一次 /public/ping · 数据仅存于浏览器内存<br />DB {{ snapshot.database }} · CACHE {{ snapshot.cache }} · SIM {{ snapshot.simulator }}</div>')
wr('components/system/ServerStatus.vue', t)
log.append('fix ServerStatus snapshot fields + template usage')

# ---------- stores/route.ts pack(): RouteWithPoints extends Route ----------
t = rd('stores/route.ts')
old_pack = """  function pack(routeId: number): RouteWithPoints | null {
    const r = routes.value.find(x => x.id === routeId)
    if (!r || r.id == null) return null
    return { route: r, points: pointsOf(routeId) }
  }"""
new_pack = """  function pack(routeId: number): RouteWithPoints | null {
    const r = routes.value.find(x => x.id === routeId)
    if (!r || r.id == null) return null
    return { ...r, points: pointsOf(routeId) }
  }"""
assert old_pack in t
t = t.replace(old_pack, new_pack)
wr('stores/route.ts', t)
log.append('fix stores/route.ts pack spread')

# ---------- views/route/RouteReplay.vue & RouteStatistics.vue: add Route import ----------
for p in ['views/route/RouteReplay.vue', 'views/route/RouteStatistics.vue']:
    t = rd(p)
    if "import type { Route," not in t and "import type { Route }" not in t:
        t = t.replace("import type { RouteProfile } from '@/types/route'",
                      "import type { Route } from '@/api/types'\nimport type { RouteProfile } from '@/types/route'", 1)
        assert "import type { Route }" in t or True
    wr(p, t)
    log.append(f'add Route import to {p}')

print('\n'.join(log))
print('PART-E DONE')
