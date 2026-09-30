import type { Route, RoutePoint } from '@/api/types'

/** 航线画像：航线 + 点位 + 派生统计 */
export interface RouteProfile {
  route: Route & { id: number }
  points: RoutePoint[]
  stats: RouteStats
}

export interface RouteStats {
  totalPoints: number
  /** haversine 累加里程（海里），与后端 distanceNm 互为校验 */
  geoDistanceNm: number
  declaredDistanceNm: number | null
  avgSegmentNm: number | null
  /** 估算航行时长（小时）= 里程 ÷ 参考航速 */
  durationHoursEst: number | null
  refSpeedKn: number | null
}

/** 对比行（RouteComparison / RouteStatistics 复用） */
export interface CompareRow {
  routeId: number
  routeName: string
  distanceNm: number
  pointCount: number
  durationHours: number | null
  color?: string
}

/** 图层条目：一条带点位的航线 */
export interface RouteLayerItem {
  route: Route
  points: RoutePoint[]
  color: string
}

export function emptyStats(): RouteStats {
  return {
    totalPoints: 0,
    geoDistanceNm: 0,
    declaredDistanceNm: null,
    avgSegmentNm: null,
    durationHoursEst: null,
    refSpeedKn: null,
  }
}

/** 两点间大圆距离（海里） */
export function haversineNm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3440.065 // 地球半径，海里
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** 点位序列的累计里程（海里） */
export function pathLengthNm(points: RoutePoint[]): number {
  let sum = 0
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]
    const q = points[i]
    if (p.latitude != null && p.longitude != null && q.latitude != null && q.longitude != null) {
      sum += haversineNm(p.latitude, p.longitude, q.latitude, q.longitude)
    }
  }
  return sum
}

export type { Route, RoutePoint }
