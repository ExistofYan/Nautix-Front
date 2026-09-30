import { getDashboardStats } from '@/api/dashboard'
import { getAllRuntimeStatus, getAllShips } from '@/api/ship'
import { getAlertRecordPage } from '@/api/alert'
import { getAlertHourDistribution } from '@/api/dashboard'
import type { AlertRecord, ShipInfo, ShipRuntimeStatus } from './types'
import type { CommandStats, HourPoint } from '@/types/command'

/* 指挥中心聚合层：只组合真实端点，不造假接口。
 * /dashboard/stats + /runtime + /alertRecord/page(8) + /dashboard/alert-hour-dist
 * + /shipInfo/all（船名映射）。任一失败静默降级为该块空数据。 */

export interface CommandSnapshot {
  stats: CommandStats | null
  runtime: ShipRuntimeStatus[]
  ships: ShipInfo[]
  recentAlerts: AlertRecord[]
  hourDist: HourPoint[]
  fetchedAt: number
}

const EMPTY_STATS: CommandStats = {
  shipCount: 0,
  alertCount: 0,
  sensorConfigCount: 0,
  weatherCount: 0,
}

/** 并发拉取大屏所需的全部真实端点，单点失败不影响其他块。 */
export async function fetchCommandSnapshot(): Promise<CommandSnapshot> {
  const [statsRes, runtimeRes, shipsRes, alertsRes, hourRes] = await Promise.all([
    getDashboardStats().catch(() => null),
    getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[]),
    getAllShips().catch(() => [] as ShipInfo[]),
    getAlertRecordPage({ page: 1, size: 8 }).catch(() => null),
    getAlertHourDistribution().catch(() => [] as { hour: number; count: number }[]),
  ])

  return {
    stats: statsRes ?? EMPTY_STATS,
    runtime: Array.isArray(runtimeRes) ? runtimeRes : [],
    ships: Array.isArray(shipsRes) ? shipsRes : [],
    recentAlerts: alertsRes?.records ?? [],
    hourDist: (Array.isArray(hourRes) ? hourRes : []).map(h => ({
      hour: Number(h.hour) || 0,
      count: Number(h.count) || 0,
    })),
    fetchedAt: Date.now(),
  }
}
