import request from './axios'
import type {
  PageResult,
  ShipInfo,
  Route,
  RoutePoint,
  ShipRuntimeStatus,
} from './types'

/* ---------- Ship Information ---------- */

export function getShipPage(params: {
  page?: number
  count?: number
  keyword?: string
  shipStatus?: string
  shipType?: string
  registryPort?: string
  sortField?: string
  sortOrder?: string
}) {
  return request.get<unknown, PageResult<ShipInfo>>('/shipInfo/page', { params })
}

export function getAllShips() {
  return request.get<unknown, ShipInfo[]>('/shipInfo/all')
}

/**
 * 全量船舶档案的会话级缓存。
 * 该接口返回约 4.4MB，数字地球点击船只弹出的轨迹面板、单船回放页
 * 每次挂载都会拉一遍，造成重复卡顿，这里让同一会话只真正请求一次。
 */
let shipsAllCache: Promise<ShipInfo[]> | null = null
export function getAllShipsCached(): Promise<ShipInfo[]> {
  if (!shipsAllCache) {
    shipsAllCache = getAllShips().catch(err => {
      // 失败不缓存，下次重新拉
      shipsAllCache = null
      throw err
    })
  }
  return shipsAllCache
}

export function getShipById(id: number) {
  return request.get<unknown, ShipInfo>(`/shipInfo/${id}`)
}

export function addShip(data: ShipInfo) {
  return request.post<unknown, boolean>('/shipInfo', data)
}

export function updateShip(data: ShipInfo) {
  return request.put<unknown, boolean>('/shipInfo', data)
}

export function deleteShip(id: number) {
  return request.delete<unknown, boolean>(`/shipInfo/${id}`)
}

/* ---------- Runtime Status ---------- */

export function getAllRuntimeStatus() {
  return request.get<unknown, ShipRuntimeStatus[]>('/runtime')
}

export function getRuntimeByShip(shipId: number) {
  return request.get<unknown, ShipRuntimeStatus>(`/runtime/${shipId}`)
}

/* ---------- Routes ---------- */

export function getRoutePage(params: {
  page?: number
  count?: number
  keyword?: string
  startPortId?: number
  endPortId?: number
  sortField?: string
  sortOrder?: string
}) {
  return request.get<unknown, PageResult<Route>>('/route/page', { params })
}

export function getRouteById(id: number) {
  return request.get<unknown, Route>(`/route/${id}`)
}

export function addRoute(data: Route) {
  return request.post<unknown, boolean>('/route', data)
}

export function updateRoute(data: Route) {
  return request.put<unknown, boolean>('/route', data)
}

export function deleteRoute(id: number) {
  return request.delete<unknown, boolean>(`/route/${id}`)
}

/* ---------- Route Points ---------- */

/** 抽稀后的航线几何：[longitude, latitude] 序列 */
export interface RouteGeometry {
  id: number
  name?: string | null
  pts: [number, number][]
  /** 抽稀前的原始点位总数 */
  n?: number | null
  /** 航线申报里程（海里） */
  distanceNm?: number | null
}

/**
 * 地图总览用的航线几何（后端内存抽稀 + 限条数）。
 * 全量 /route-point 有上百 MB，直接拉取会让页面卡死，
 * 因此地图/数字地球一律走这个接口；单条航线完整点位用 ids 参数取。
 */
export function getRouteGeometry(params?: { limit?: number; stride?: number; ids?: string }) {
  return request.get<unknown, RouteGeometry[]>('/route/geometry', { params })
}

/** 按航线 id 取完整点位（走后端 routeId 过滤，不拉全量） */
export function getRoutePointsByRoute(routeId: number) {
  return request.get<unknown, RoutePoint[]>('/route-point', { params: { routeId } })
}

export function getAllRoutePoints() {
  return request.get<unknown, RoutePoint[]>('/route-point')
}

export function getRoutePointById(id: number) {
  return request.get<unknown, RoutePoint>(`/route-point/${id}`)
}
