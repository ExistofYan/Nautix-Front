/* 地图共享类型：图层 ID、投影状态、边界、视图 API */

export type LayerId =
  | 'ocean'
  | 'route'
  | 'port'
  | 'ship'
  | 'traffic'
  | 'alert'
  | 'weather'
  | 'heatmap'

export const LAYER_IDS: readonly LayerId[] = [
  'ocean',
  'route',
  'port',
  'ship',
  'traffic',
  'alert',
  'weather',
  'heatmap',
]

export const LAYER_LABELS: Record<LayerId, string> = {
  ocean: '海洋底图',
  route: '航线',
  port: '港口',
  ship: '船舶',
  traffic: '交通流',
  alert: '告警',
  weather: '天气',
  heatmap: '热力点',
}

/** 经纬度点（未投影） */
export interface LonLat {
  longitude: number
  latitude: number
}

/** 视口边界（度数） */
export interface MapBounds {
  minLon: number
  maxLon: number
  minLat: number
  maxLat: number
}

/** CesiumViewer emit('ready') 传出的轻量视图 API */
export interface ChartViewerApi {
  focusShip(shipId: number): void
  fitAll(): void
  zoomBy(factor: number): void
}

/** 默认全球视野 */
export const WORLD_BOUNDS: MapBounds = {
  minLon: -180,
  maxLon: 180,
  minLat: -72,
  maxLat: 84,
}

/** viewBox 逻辑尺寸（所有图层共用同一坐标系） */
export const VIEW_W = 1000
export const VIEW_H = 600
