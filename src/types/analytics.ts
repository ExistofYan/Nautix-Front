/** 分析中心通用小类型 */

export interface AnalyticsBucket {
  key: string
  label: string
  count: number
}

export interface NameValue {
  name: string
  value: number
}

export interface ScatterPoint {
  routeId: number
  name: string
  distanceNm: number
  pointCount: number
}
