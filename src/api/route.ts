import request from './axios'
import type { PageResult, Route, RoutePoint } from './types'

/* Fetch routes with paging (GET /route/page).
 * The legacy GET /route endpoint does not exist on the backend. */
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

/* Top N routes by distance, for the Analytics chart */
export function getTopRoutesByDistance(count = 10) {
  return getRoutePage({
    page: 1,
    count,
    sortField: 'distanceNm',
    sortOrder: 'desc'
  })
}

export function getRouteDetail(id: number) {
  return request.get<unknown, Route>(`/route/${id}`)
}

/* 航线点位：后端无 /route/{id}/points 端点，取全量后前端按 routeId 过滤 */
export async function getRoutePoints(routeId: number): Promise<RoutePoint[]> {
  const all = await request.get<unknown, RoutePoint[]>('/route-point')
  return (all ?? []).filter((p) => p.routeId === routeId)
}
