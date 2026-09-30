import type { AlertRecord, AlertRule } from '@/api/types'

/** 告警等级（前端派生：由规则 alertLevel 映射到展示色阶） */
export const ALERT_LEVEL = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
} as const

export type AlertLevelKey = (typeof ALERT_LEVEL)[keyof typeof ALERT_LEVEL]

/** 后端规则 alertLevel(数值) → 前端等级 key */
export function levelOf(alertLevel?: number | null): AlertLevelKey {
  if (alertLevel == null) return ALERT_LEVEL.INFO
  if (alertLevel >= 3) return ALERT_LEVEL.CRITICAL
  if (alertLevel === 2) return ALERT_LEVEL.WARNING
  return ALERT_LEVEL.INFO
}

export const LEVEL_COLOR: Record<AlertLevelKey, string> = {
  [ALERT_LEVEL.CRITICAL]: '#fb7185',
  [ALERT_LEVEL.WARNING]: '#fbbf24',
  [ALERT_LEVEL.INFO]: '#38bdf8',
}

export const LEVEL_LABEL: Record<AlertLevelKey, string> = {
  [ALERT_LEVEL.CRITICAL]: '紧急',
  [ALERT_LEVEL.WARNING]: '警告',
  [ALERT_LEVEL.INFO]: '提示',
}

/** 带解析信息的告警行（record + 船名/规则名 join 结果） */
export interface EnrichedAlert extends AlertRecord {
  shipName?: string
  ruleName?: string
  alertLevel?: number | null
  levelKey: AlertLevelKey
}

/** 热力图单元：周 × 小时 */
export interface HeatCell {
  day: number
  hour: number
  count: number
}

/** 按日分桶的统计序列 */
export interface DailyBucket {
  date: string
  total: number
  pending: number
}

/** 规则触发聚合行 */
export interface RuleAggRow {
  ruleId: number
  ruleName: string
  alertLevel: number | null
  count: number
  pending: number
}

export type { AlertRecord, AlertRule }
