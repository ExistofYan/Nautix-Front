import request from './axios'
import type {
  PageResult,
  SensorConfig,
  SensorData,
  SensorDict,
} from './types'

/* ---------- Sensor Data ---------- */

export function getSensorDataPage(params: {
  page?: number
  size?: number
  shipId?: number
  startTime?: string
  endTime?: string
}) {
  return request.get<unknown, PageResult<SensorData>>('/sensorData/page', { params })
}

export function getSensorDataList() {
  return request.get<unknown, SensorData[]>('/sensorData/list')
}

export function addSensorData(data: SensorData) {
  return request.post<unknown, boolean>('/sensorData', data)
}

/**
 * 趋势读数。
 * 全站最新 N 条几乎全是不同 config（每路仅 1~2 点），画不出线；
 * 传 shipId 才能拿到该船连续序列（每船 16 类传感器）。
 */
export function getSensorTrendData(limit: number = 60, shipId?: number) {
  return request.get<unknown, SensorData[]>('/sensorData/trend', {
    params: shipId != null ? { limit, shipId } : { limit },
  })
}

export function addSensorDataBatch(data: SensorData[]) {
  return request.post<unknown, boolean>('/sensorData/batch', data)
}

export function updateSensorData(data: SensorData) {
  return request.put<unknown, boolean>('/sensorData', data)
}

export function deleteSensorData(id: number) {
  return request.delete<unknown, boolean>(`/sensorData/${id}`)
}

export interface VolatilityStat {
  configId: number
  cnt: number
  stdDev: number | null
  mean: number | null
  /** 后端直接带出的传感器名（前端配置为限量加载，不能靠本地 join） */
  sensorName?: string | null
  /** 后端直接带出的所属船 id */
  shipId?: number | null
}

/**
 * 波动率统计（后端 SQL 聚合 + 限量）。
 * scan 语义随 shipId 变化：全站=主键窗口行数，单船=该船最近读数条数。
 */
export function getSensorVolatility(scan = 200000, top = 300, shipId?: number) {
  return request.get<unknown, VolatilityStat[]>('/sensorData/volatility', {
    params: shipId != null ? { scan, top, shipId } : { scan, top },
  })
}

/* ---------- Sensor Dictionary ---------- */

export function getSensorDictPage(params: {
  page?: number
  count?: number
  keyword?: string
  sortField?: string
  sortOrder?: string
}) {
  return request.get<unknown, PageResult<SensorDict>>('/sensorDict/page', { params })
}

export function getAllSensorDicts() {
  return request.get<unknown, SensorDict[]>('/sensorDict/list')
}

export function getSensorDictById(id: number) {
  return request.get<unknown, SensorDict>(`/sensorDict/${id}`)
}

export function addSensorDict(data: SensorDict) {
  return request.post<unknown, boolean>('/sensorDict', data)
}

export function updateSensorDict(data: SensorDict) {
  return request.put<unknown, boolean>('/sensorDict', data)
}

export function deleteSensorDict(id: number) {
  return request.delete<unknown, boolean>(`/sensorDict/${id}`)
}

/* ---------- Sensor Configuration ---------- */

export function getSensorConfigPage(params: {
  page?: number
  count?: number
  shipId?: number
  typeId?: number
  sensorName?: string
  status?: number
  sortField?: string
  sortOrder?: string
}) {
  return request.get<unknown, PageResult<SensorConfig>>('/sensorConfig/list', { params })
}

/**
 * 传感器配置列表。
 * 后端 sensor_config 有 16 万条，全站返回已限量；
 * 单船页面必须传 shipId，否则限量结果里大概率不含该船的 16 个传感器。
 */
export function getAllSensorConfigs(shipId?: number, limit?: number) {
  return request.get<unknown, SensorConfig[]>('/sensorConfig', {
    params: shipId != null ? { shipId, limit } : { limit },
  })
}

/** 配置总数（列表已限量，KPI 用这个拿真实总数，避免为一个数字拉 16 万条） */
export function getSensorConfigCount(shipId?: number, status?: number) {
  return request.get<unknown, number>('/sensorConfig/count', {
    params: shipId != null || status != null ? { shipId, status } : undefined,
  })
}

export function getSensorConfigById(id: number) {
  return request.get<unknown, SensorConfig>(`/sensorConfig/${id}`)
}

export function addSensorConfig(data: SensorConfig) {
  return request.post<unknown, boolean>('/sensorConfig', data)
}

export function updateSensorConfig(data: SensorConfig) {
  return request.put<unknown, boolean>('/sensorConfig', data)
}

export function deleteSensorConfig(id: number) {
  return request.delete<unknown, boolean>(`/sensorConfig/${id}`)
}
