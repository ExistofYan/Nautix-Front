/* 船队类型：后端无 /fleet 端点，船队 = 按运营公司聚合的船舶视图模型 */
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'

/** 单个船队（一家运营公司） */
export interface Fleet {
  company: string
  ships: ShipInfo[]
  /** shipId → 实时状态 */
  runtimeById: Record<number, ShipRuntimeStatus>
  memberCount: number
  avgSpeed: number | null
  avgFuel: number | null
  avgEngineLoad: number | null
  avgShipAge: number | null
}

/** 成员统计行 */
export interface MemberStat {
  ship: ShipInfo
  runtime: ShipRuntimeStatus | null
}

/** 任务规划（localStorage 持久化占位） */
export interface Mission {
  id: string
  shipId: number
  shipName?: string
  routeId: number
  routeName?: string
  startAt: string
  endAt: string
  note?: string
}
