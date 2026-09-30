/* Command-center view models. Entities live in '@/api/types' — never redefine them here. */
import type { AlertRecord, ShipRuntimeStatus } from '@/api/types'

/** /dashboard/stats 的别名，便于本组内引用。 */
export interface CommandStats {
  shipCount: number
  alertCount: number
  sensorConfigCount: number
  weatherCount: number
}

/** KPI 墙的单卡数据（count-up 动画驱动源）。 */
export interface KpiItem {
  key: string
  label: string
  value: number
  unit?: string
  /** 小数位 */
  precision?: number
  icon?: string
  tone?: 'cyan' | 'blue' | 'violet' | 'green' | 'amber' | 'red'
}

/** 告警滚动条条目：record + 解析出的船名/规则名。 */
export interface TickerItem extends AlertRecord {
  shipName: string
  ruleName: string
  levelKey: 'critical' | 'warning' | 'info'
}

/** 交通总览表行：runtime join 船名。 */
export interface ShipRow extends ShipRuntimeStatus {
  shipName: string
}

/** 按航行状态分组的计数徽章。 */
export interface StatusBadgeItem {
  status: string
  count: number
}

/** 24 小时告警分布点。 */
export interface HourPoint {
  hour: number
  count: number
}
