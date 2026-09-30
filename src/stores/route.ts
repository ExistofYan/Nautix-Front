import { defineStore } from 'pinia'
import type { RouteWithPoints } from '@/types/routePoint'
import { computed, ref } from 'vue'
import { getAllPorts } from '@/api/port'
import { getRoutePage } from '@/api/route'
import { getAllShips } from '@/api/ship'
import request from '@/api/axios'
import type { Port, Route, RoutePoint, ShipInfo } from '@/api/types'
import { emptyStats, haversineNm, pathLengthNm, type RouteProfile, type RouteStats } from '@/types/route'

/** 图层调色板（与 chartTheme 一致） */
export const ROUTE_PALETTE = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#fb7185', '#818cf8']

/**
 * 航线数据中枢：缓存航线、全量点位、港口名映射，
 * 派生每条航线的画像统计（haversine 里程 / 点数 / 估时）。
 */
export const useRouteStore = defineStore('route', () => {
  const routes = ref<Route[]>([])
  const allPoints = ref<RoutePoint[]>([])
  const ports = ref<Port[]>([])
  const ships = ref<ShipInfo[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const current = ref<Route | null>(null)

  /** routeId → 按 pointOrder 排序的点位 */
  const pointsByRoute = computed(() => {
    const map = new Map<number, RoutePoint[]>()
    for (const p of allPoints.value) {
      if (p.routeId == null || p.latitude == null || p.longitude == null) continue
      const arr = map.get(p.routeId) ?? []
      arr.push(p)
      map.set(p.routeId, arr)
    }
    for (const [, arr] of map) arr.sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0))
    return map
  })

  const portMap = computed(() => new Map(ports.value.map(p => [p.id as number, p])))

  function portNameOf(id?: number | null): string {
    if (id == null) return '未知港'
    return portMap.value.get(id)?.portName || `#${id}`
  }

  function pointsOf(routeId: number): RoutePoint[] {
    return pointsByRoute.value.get(routeId) ?? []
  }

  function statsOf(route: Route & { id: number }): RouteStats {
    const pts = pointsOf(route.id)
    const geo = pathLengthNm(pts)
    const segs = Math.max(1, pts.length - 1)
    // 参考航速：取该船队平均 sailingSpeed，缺省 12 kn
    const speeds = ships.value.map(s => s.sailingSpeed).filter((n): n is number => typeof n === 'number' && n > 0)
    const ref = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 12
    return {
      totalPoints: pts.length,
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
      const [routeRes, pts, portList, shipList] = await Promise.all([
        getRoutePage({ page: 1, count: 100 }).catch(() => null),
        request.get<unknown, RoutePoint[]>('/route-point').catch(() => [] as RoutePoint[]),
        getAllPorts().catch(() => [] as Port[]),
        getAllShips().catch(() => [] as ShipInfo[]),
      ])
      routes.value = routeRes?.records ?? []
      allPoints.value = pts ?? []
      ports.value = portList ?? []
      ships.value = shipList ?? []
      loaded.value = true
    } finally {
      loading.value = false
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
    select,
    distanceNm,
    emptyStats,
  }
})
