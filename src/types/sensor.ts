/* 传感器分析域类型：实体一律复用 '@/api/types'，此处只放派生视图模型 */
import type { SensorConfig, SensorDict } from '@/api/types'

/** 折线图通用点：t=时间标签，v=数值 */
export interface SensorPoint {
  t: string
  v: number
}

/** volatility 端点的单条统计（后端 SQL 聚合，已带名称与船号） */
export interface VolatilityStat {
  configId: number
  cnt: number
  stdDev: number | null
  mean: number | null
  /** 后端 join 带出的传感器名（前端配置为限量加载，不能只靠本地 join） */
  sensorName?: string | null
  /** 后端 join 带出的所属船 id */
  shipId?: number | null
}

/** volatility + 配置字典 join 后的异常榜行 */
export interface AnomalyRow extends VolatilityStat {
  sensorName?: string
  shipId?: number
  shipName?: string
  unit?: string
  /** stdDev 相对均值的离散系数；mean 为 0 或缺失时为 null */
  cv: number | null
  /** 是否超过告警阈值（stdDev > |mean| * 5%） */
  abnormal: boolean
}

/** 树节点：船 → 传感器 */
export interface SensorTreeNode {
  key: string
  label: string
  children?: SensorTreeNode[]
  config?: SensorConfig
}

/** 传感器聚合摘要（均值/极值/标准差） */
export interface AggStat {
  count: number
  mean: number | null
  max: number | null
  min: number | null
  stdDev: number | null
}

/** 带字典信息的传感器配置视图 */
export interface ConfigWithDict extends SensorConfig {
  dict?: SensorDict
  unit: string
  typeName?: string
}
