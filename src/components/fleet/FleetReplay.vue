<template>
  <div class="fleet-replay nx-panel">
    <div class="fr-head">
      <span class="fr-title"><el-icon><VideoCamera /></el-icon> 船队编组回放</span>
      <el-select-v2 v-model="routeId" :options="routeOptions" filterable placeholder="选择航线" style="width: 240px" />
      <el-button size="small" round :loading="loading" @click="loadAll">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <el-empty v-if="!routes.length && !loading" description="暂无航线数据（后端未启动或无航线）" :image-size="64" />

    <template v-else>
      <svg viewBox="0 0 1000 600" class="fr-map" preserveAspectRatio="xMidYMid meet">
        <rect width="1000" height="600" fill="#081120" />
        <!-- 经纬网格 -->
        <line v-for="i in 9" :key="'gx' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="600" stroke="rgba(56,189,248,.07)" />
        <line v-for="i in 5" :key="'gy' + i" x1="0" :y1="i * 100" x2="1000" :y2="i * 100" stroke="rgba(56,189,248,.07)" />

        <!-- 选中航线全路径 -->
        <polyline
          v-if="selectedPath"
          :points="selectedPath"
          fill="none"
          stroke="rgba(56,189,248,.35)"
          stroke-width="1.6"
          stroke-dasharray="5 4"
        />

        <!-- 各船当前位置 + 航向短线（数量与标签均有上限） -->
        <g v-for="s in shipMarks" :key="'sh' + s.shipId">
          <line
            :x1="s.x" :y1="s.y"
            :x2="s.x + Math.sin((s.heading * Math.PI) / 180) * (8 + s.speed)"
            :y2="s.y - Math.cos((s.heading * Math.PI) / 180) * (8 + s.speed)"
            :stroke="onRoute(s.shipId) ? '#34d399' : '#64748b'"
            stroke-width="1.8" stroke-linecap="round"
          />
          <circle :cx="s.x" :cy="s.y" r="3.4" :fill="onRoute(s.shipId) ? '#34d399' : '#94a3b8'" />
          <text v-if="s.label" :x="s.x + 7" :y="s.y - 6" font-size="10" fill="#cbd5e1">{{ s.label }}</text>
        </g>
      </svg>

      <div class="fr-foot">
        <span>{{ runtime.length }} 艘在报 · {{ matchedCount }} 艘位于所选航线 ±{{ TOL_DEG }}° 带内</span>
        <span class="fr-tip">口径：/runtime 船位 × /route-point 航点走廊匹配，每 30s 自动刷新；地图最多绘制 {{ MARK_CAP }} 个标记、{{ LABEL_CAP }} 个船名</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAllShipsCached, getAllRuntimeStatus, getRoutePointsByRoute } from '@/api/ship'
import { getRoutePage } from '@/api/route'
import type { Route, RoutePoint, ShipInfo, ShipRuntimeStatus } from '@/api/types'
import { makeProjector } from '@/hooks/useMap'
import { WORLD_BOUNDS } from '@/types/map'

/** 航点走廊容差（度），船与任一航点球面距离在此范围内视为"在该航线上" */
const TOL_DEG = 3

const loading = ref(false)
const routes = ref<Route[]>([])
const points = ref<RoutePoint[]>([])
const ships = ref<ShipInfo[]>([])
const runtime = ref<ShipRuntimeStatus[]>([])
const routeId = ref<number | undefined>(undefined)

let timer: number | undefined

const routeOptions = computed(() =>
  routes.value.map(r => ({ value: r.id as number, label: r.routeName || `航线 #${r.id}` })),
)

const selectedPoints = computed(() =>
  points.value
    .filter(p => p.routeId === routeId.value && p.latitude != null && p.longitude != null)
    .sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0)),
)

const proj = computed(() => makeProjector(WORLD_BOUNDS))

const selectedPath = computed(() => {
  const pts = selectedPoints.value
  if (pts.length < 2) return ''
  return pts.map(p => {
    const q = proj.value({ longitude: p.longitude as number, latitude: p.latitude as number })
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`
  }).join(' ')
})

/**
 * 走廊匹配：runtime 有 1 万条、单条航线可能有上千航点，
 * 直接双重循环是千万级比较且每次重算都会冻结主线程。
 * 这里把航点按 TOL_DEG 分桶进网格，每艘船只查同桶与相邻 8 桶，
 * 复杂度降为 O(船数 × 常数)。
 */
const matchedIds = computed(() => {
  const pts = selectedPoints.value
  const set = new Set<number>()
  if (!pts.length) return set

  const cell = TOL_DEG
  const key = (lat: number, lon: number) => `${Math.floor(lat / cell)}:${Math.floor(lon / cell)}`
  const grid = new Map<string, [number, number][]>()
  for (const p of pts) {
    const k = key(p.latitude as number, p.longitude as number)
    const bucket = grid.get(k)
    if (bucket) bucket.push([p.latitude as number, p.longitude as number])
    else grid.set(k, [[p.latitude as number, p.longitude as number]])
  }

  for (const r of runtime.value) {
    if (r.shipId == null || r.latitude == null || r.longitude == null) continue
    const lat = r.latitude
    const lon = r.longitude
    const la = Math.floor(lat / cell)
    const lo = Math.floor(lon / cell)
    outer: for (let da = -1; da <= 1; da++) {
      for (let dl = -1; dl <= 1; dl++) {
        const bucket = grid.get(`${la + da}:${lo + dl}`)
        if (!bucket) continue
        for (const [plat, plon] of bucket) {
          if (Math.abs(plat - lat) <= TOL_DEG && Math.abs(plon - lon) <= TOL_DEG) {
            set.add(r.shipId)
            break outer
          }
        }
      }
    }
  }
  return set
})

const matchedCount = computed(() => matchedIds.value.size)

/** 航线走廊匹配：一次遍历 runtime × 航点，结果存 Set，模板里 O(1) 查表 */
function onRoute(shipId: number): boolean {
  return matchedIds.value.has(shipId)
}

/** 标记上限：runtime 有 1 万条，全画就是 3 万个 SVG 节点，必然卡死 */
const MARK_CAP = 400
const LABEL_CAP = 80

interface ShipMark {
  shipId: number
  name: string
  x: number
  y: number
  heading: number
  speed: number
}

/** 当前页在报船的标记（航线上的船优先，其余补足到上限） */
const shipMarks = computed(() => {
  const nameById = new Map<number, string>()
  for (const s of ships.value) if (s.id != null) nameById.set(s.id, s.shipName || `船 #${s.id}`)
  const on: ShipMark[] = []
  const off: ShipMark[] = []
  for (const r of runtime.value) {
    if (r.shipId == null || r.latitude == null || r.longitude == null) continue
    const q = proj.value({ longitude: r.longitude as number, latitude: r.latitude as number })
    const mark = {
      shipId: r.shipId as number,
      name: nameById.get(r.shipId as number) || `#${r.shipId}`,
      x: q.x, y: q.y,
      heading: r.heading ?? 0,
      speed: r.speed ?? 0,
    }
    if (matchedIds.value.has(r.shipId)) on.push(mark)
    else off.push(mark)
  }
  const all = on.concat(off).slice(0, MARK_CAP)
  // 只给前 LABEL_CAP 个标记画名字，避免上千条中文标签叠成一团
  return all.map((m, i) => ({ ...m, label: i < LABEL_CAP ? m.name : '' }))
})

async function loadAll() {
  loading.value = true
  try {
    const [pageRes, allShips, rt] = await Promise.all([
      getRoutePage({ page: 1, count: 50 }).catch(() => null),
      getAllShipsCached().catch(() => [] as ShipInfo[]),
      getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[]),
    ])
    routes.value = pageRes?.records ?? []
    ships.value = Array.isArray(allShips) ? allShips : []
    runtime.value = Array.isArray(rt) ? rt : []
    if (routeId.value == null && routes.value.length) routeId.value = routes.value[0].id
    await loadRoutePoints()
  } catch {
    /* 静默降级为空态 */
  } finally {
    loading.value = false
  }
}

/** 只取当前所选航线的点位：全量 /route-point 有上百 MB，绝不能在这里拉 */
async function loadRoutePoints() {
  if (routeId.value == null) {
    points.value = []
    return
  }
  try {
    const pts = await getRoutePointsByRoute(routeId.value)
    points.value = Array.isArray(pts) ? pts : []
  } catch {
    points.value = []
  }
}

watch(routeId, () => { void loadRoutePoints() })

onMounted(() => {
  void loadAll()
  timer = window.setInterval(() => void loadAll(), 30_000)
})

onBeforeUnmount(() => {
  if (timer !== undefined) window.clearInterval(timer)
})
</script>

<style scoped>
.fleet-replay { border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.fr-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.fr-title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 14.5px; }
.fr-title .el-icon { color: #7dd3fc; }
.fr-map { width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--nx-panel-border); background: #081120; }
.fr-foot { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; color: var(--nx-text-dim); }
.fr-tip { color: #475569; }
</style>
