import { defineStore } from 'pinia'
import type { RouteWithPoints } from '@/types/routePoint'
import { computed, ref } from 'vue'
import { getAllPorts } from '@/api/port'
import { getRoutePage } from '@/api/route'
import { getAllShipsCached, getRouteGeometry, getRoutePointsByRoute, type RouteGeometry } from '@/api/ship'
import type { Port, Route, RoutePoint, ShipInfo } from '@/api/types'
import { emptyStats, haversineNm, pathLengthNm, type RouteProfile, type RouteStats } from '@/types/route'

/** 图层调色板（与 chartTheme 一致） */
export const ROUTE_PALETTE = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#fb7185', '#818cf8']

/**
 * 航线数据中枢。
 *
 * 性能口径：全量 /route-point 有上百 MB，直接拉取会让页面卡死，
 * 因此总览只拉后端抽稀几何（/route/geometry），
 * 单条航线的完整点位由 ensurePoints() 按需加载并缓存。
 */
export const useRouteStore = defineStore('route', () => {
  const routes = ref<Route[]>([])
  const ports = ref<Port[]>([])
  const ships = ref<ShipInfo[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const current = ref<Route | null>(null)

  /** routeId → 抽稀几何（总览渲染与画像统计用） */
  const geomMap = ref(new Map<number, RouteGeometry>())
  /** routeId → 完整点位缓存（ensurePoints 按需填充） */
  const pointsCache = ref(new Map<number, RoutePoint[]>())

  /** 几何点 → RoutePoint 形状，兼容既有图层/画像代码 */
  function geomPointsOf(routeId: number): RoutePoint[] {
    const g = geomMap.value.get(routeId)
    if (!g || !Array.isArray(g.pts)) return []
    return g.pts.map((pt, i) => ({
      id: null,
      routeId,
      pointOrder: i + 1,
      longitude: pt[0],
      latitude: pt[1],
    })) as unknown as RoutePoint[]
  }

  /**
   * 当前可用点位：已按需加载过则用完整点位，否则退化为抽稀几何。
   * 地图/统计用抽稀足够；回放/详情先调 ensurePoints 拿完整序列。
   */
  function pointsOf(routeId: number): RoutePoint[] {
    return pointsCache.value.get(routeId) ?? geomPointsOf(routeId)
  }

  /** 兼容旧字段：总览可见的全部（抽稀）点位 */
  const allPoints = computed<RoutePoint[]>(() => {
    const out: RoutePoint[] = []
    for (const id of geomMap.value.keys()) out.push(...geomPointsOf(id))
    return out
  })

  const pointsByRoute = computed(() => {
    const map = new Map<number, RoutePoint[]>()
    for (const id of geomMap.value.keys()) map.set(id, pointsOf(id))
    return map
  })

  const portMap = computed(() => new Map(ports.value.map(p => [p.id as number, p])))

  function portNameOf(id?: number | null): string {
    if (id == null) return 'Unknown port'
    return portMap.value.get(id)?.portName || `#${id}`
  }

  function statsOf(route: Route & { id: number }): RouteStats {
    const pts = pointsOf(route.id)
    const geo = pathLengthNm(pts)
    const segs = Math.max(1, pts.length - 1)
    // 原始点数优先（几何接口带 n），避免抽稀后统计失真
    const nRaw = pointsCache.value.has(route.id) ? pts.length : (geomMap.value.get(route.id)?.n ?? pts.length)
    const speeds = ships.value.map(s => s.sailingSpeed).filter((n): n is number => typeof n === 'number' && n > 0)
    const ref = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 12
    return {
      totalPoints: nRaw,
      geoDistanceNm: geo,
      declaredDistanceNm: typeof route.distanceNm === 'number' ? route.distanceNm : null,
      avgSegmentNm: pts.length > 1 ? geo / segs : null,
      durationHoursEst: geo > 0 ? geo / ref : null,
      refSpeedKn: ref,
    }
  }

  function profileOf(route: Route & { id: number }): RouteProfile {
    return { route, points: pointsOf(route.id), stats: statsOf(route) }
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const [routeRes, geoms, portList, shipList] = await Promise.all([
        getRoutePage({ page: 1, count: 100 }).catch(() => null),
        getRouteGeometry({ limit: 800, stride: 6 }).catch(() => [] as RouteGeometry[]),
        getAllPorts().catch(() => [] as Port[]),
        getAllShipsCached().catch(() => [] as ShipInfo[]),
      ])
      routes.value = routeRes?.records ?? []
      geomMap.value = new Map(
        (Array.isArray(geoms) ? geoms : []).map(g => [g.id, g] as [number, RouteGeometry]),
      )
      pointsCache.value = new Map()
      ports.value = portList ?? []
      ships.value = shipList ?? []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 按需拉取单条航线的完整点位（回放 / 详情页用），带缓存。
   */
  async function ensurePoints(routeId: number): Promise<RoutePoint[]> {
    const hit = pointsCache.value.get(routeId)
    if (hit) return hit
    try {
      const pts = await getRoutePointsByRoute(routeId)
      const arr = Array.isArray(pts) ? pts : []
      // 重建 Map 引用以触发依赖 pointsOf 的计算属性更新
      pointsCache.value = new Map(pointsCache.value).set(routeId, arr)
      return arr
    } catch {
      return []
    }
  }

  function select(route: Route | null) {
    current.value = route
  }

  /** 单条航线画像（含空兜底），供组件直接调用 */
  function profileById(id: number): RouteProfile | null {
    const r = routes.value.find(x => x.id === id)
    if (!r || r.id == null) return null
    return profileOf(r as Route & { id: number })
  }

  /** 航线+点位打包视图（回放/对比用，类型见 '@/types/routePoint'） */
  function pack(routeId: number): RouteWithPoints | null {
    const r = routes.value.find(x => x.id === routeId)
    if (!r || r.id == null) return null
    return { ...r, points: pointsOf(routeId) }
  }

  /** 两点间距离工具透出 */
  function distanceNm(a: RoutePoint, b: RoutePoint): number {
    if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return 0
    return haversineNm(a.latitude, a.longitude, b.latitude, b.longitude)
  }

  return {
    routes, pack,
    allPoints,
    ports,
    ships,
    loading,
    loaded,
    current,
    pointsByRoute,
    portMap,
    portNameOf,
    pointsOf,
    statsOf,
    profileOf,
    profileById,
    load,
    ensurePoints,
    select,
    distanceNm,
    emptyStats,
  }
})
