/* 航迹回放数据源：后端无 /replay 端点，此处用真实端点组合出回放帧。 */
import { getAllRoutePoints } from '@/api/ship'
import { getRouteDetail } from '@/api/route'
import type { Route, RoutePoint } from '@/api/types'
import type { ReplayFrame } from '@/types/replay'

/** 原始航线点位 → 回放帧（过滤缺经纬度的脏数据，按 pointOrder 排序） */
export function toFrames(points: RoutePoint[]): ReplayFrame[] {
  return points
    .filter(p => p.latitude != null && p.longitude != null)
    .sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0))
    .map((p, i) => ({
      pointOrder: p.pointOrder ?? i + 1,
      latitude: p.latitude as number,
      longitude: p.longitude as number,
      label: `WP-${i + 1}`,
    }))
}

/** 拉取一条航线的元信息 */
export async function loadReplayRoute(routeId: number): Promise<Route | null> {
  try {
    return await getRouteDetail(routeId)
  } catch {
    return null
  }
}

/** 拉取某条航线的全部回放帧（/route-point 全量后前端过滤） */
export async function loadReplayFrames(routeId: number): Promise<ReplayFrame[]> {
  const all = await getAllRoutePoints()
  return toFrames((all ?? []).filter(p => p.routeId === routeId))
}

/** 纯函数：取 index 邻域帧，用于计算当前航向 */
export function neighborFrames(frames: ReplayFrame[], index: number): { prev: ReplayFrame | null; next: ReplayFrame | null } {
  const prev = index > 0 ? frames[index - 1] : null
  const next = index < frames.length - 1 ? frames[index + 1] : null
  return { prev, next }
}

/** 纯函数：由相邻两点求屏幕航向角（度，0=正东，顺时针；SVG 的 y 轴向下所以纬度取反） */
export function headingDeg(from: ReplayFrame, to: ReplayFrame): number {
  const dx = to.longitude - from.longitude
  const dy = -(to.latitude - from.latitude)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}
