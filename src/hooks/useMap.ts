import { reactive, readonly } from 'vue'
import type { LonLat, MapBounds } from '@/types/map'
import { VIEW_W, VIEW_H, WORLD_BOUNDS } from '@/types/map'

export { VIEW_W, VIEW_H }

/**
 * 纯函数投影：等经纬线性映射 bounds → viewBox(1000×600)。
 * 纬度不裁剪（南半球 y 更大），经度环绕归一到 [minLon, minLon+360)。
 */
export function makeProjector(bounds: MapBounds) {
  const lonSpan = Math.max(1e-6, bounds.maxLon - bounds.minLon)
  const latSpan = Math.max(1e-6, bounds.maxLat - bounds.minLat)
  return function project(p: LonLat): { x: number; y: number } {
    let lon = p.longitude
    // 简单环绕，避免跨 180° 航线拉出横贯全图的直线
    while (lon < bounds.minLon) lon += 360
    while (lon > bounds.minLon + 360) lon -= 360
    return {
      x: ((lon - bounds.minLon) / lonSpan) * VIEW_W,
      y: ((bounds.maxLat - p.latitude) / latSpan) * VIEW_H,
    }
  }
}

/** 由中心点与缩放级别求边界；zoom=1 全球，指数放大收窄视野 */
export function boundsFor(center: LonLat, zoom: number): MapBounds {
  const z = Math.min(24, Math.max(1, zoom))
  const lonSpan = 360 / z
  const latSpan = (WORLD_BOUNDS.maxLat - WORLD_BOUNDS.minLat) / z
  return {
    minLon: center.longitude - lonSpan / 2,
    maxLon: center.longitude + lonSpan / 2,
    minLat: center.latitude - latSpan / 2,
    maxLat: center.latitude + latSpan / 2,
  }
}

/** 一组点的包围盒（含 5% 边距）；空数组返回全球 */
export function fitBounds(points: LonLat[]): MapBounds {
  const valid = points.filter(
    (p) => Number.isFinite(p.longitude) && Number.isFinite(p.latitude),
  )
  if (valid.length === 0) return { ...WORLD_BOUNDS }
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const p of valid) {
    if (p.longitude < minLon) minLon = p.longitude
    if (p.longitude > maxLon) maxLon = p.longitude
    if (p.latitude < minLat) minLat = p.latitude
    if (p.latitude > maxLat) maxLat = p.latitude
  }
  if (maxLon - minLon < 1e-6) { minLon -= 2; maxLon += 2 }
  if (maxLat - minLat < 1e-6) { minLat -= 2; maxLat += 2 }
  const mx = (maxLon - minLon) * 0.05
  const my = (maxLat - minLat) * 0.05
  return {
    minLon: minLon - mx,
    maxLon: maxLon + mx,
    minLat: minLat - my,
    maxLat: maxLat + my,
  }
}

/**
 * 地图状态 hook：持有 view（center/zoom/bounds），提供平移/缩放/适配。
 * 无 store 依赖，组件内即用即建；多实例互不影响。
 */
export function useMap(initial?: Partial<MapBounds>) {
  const state = reactive({
    center: {
      longitude: initial ? ((initial.minLon ?? 0) + (initial.maxLon ?? 0)) / 2 : 0,
      latitude: initial ? ((initial.minLat ?? 0) + (initial.maxLat ?? 0)) / 2 : 10,
    } as LonLat,
    zoom: initial ? 1 : 1,
    bounds: { ...(initial ?? WORLD_BOUNDS) } as MapBounds,
  })

  function setBounds(b: MapBounds) {
    state.bounds = b
    state.center = {
      longitude: (b.minLon + b.maxLon) / 2,
      latitude: (b.minLat + b.maxLat) / 2,
    }
    const span = b.maxLon - b.minLon
    state.zoom = Math.min(24, Math.max(1, 360 / Math.max(span, 0.0001)))
  }

  /** 以某点为中心缩放（factor>1 拉近） */
  function zoomAt(factor: number, anchor?: LonLat) {
    if (anchor) state.center = { ...anchor }
    const cur = state.bounds
    const halfLon = Math.max(0.2, (cur.maxLon - cur.minLon) / 2 / factor)
    const halfLat = Math.max(0.15, (cur.maxLat - cur.minLat) / 2 / factor)
    setBounds({ minLon: state.center.longitude - halfLon, maxLon: state.center.longitude + halfLon, minLat: state.center.latitude - halfLat, maxLat: state.center.latitude + halfLat })
  }

  /** 按度数平移视野 */
  function panBy(dLon: number, dLat: number) {
    const c = state.bounds
    setBounds({ minLon: c.minLon + dLon, maxLon: c.maxLon + dLon, minLat: c.minLat + dLat, maxLat: c.maxLat + dLat })
  }

  function fitPoints(points: LonLat[]) {
    setBounds(fitBounds(points))
  }

  function reset() {
    setBounds({ ...WORLD_BOUNDS })
  }

  const proj = () => makeProjector(state.bounds)

  return {
    view: readonly(state),
    bounds: () => state.bounds,
    project: proj,
    zoomAt,
    panBy,
    fitPoints,
    reset,
    setBounds,
    size: { width: VIEW_W, height: VIEW_H },
  }
}
