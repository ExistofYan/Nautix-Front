/* 航迹回放类型：复用后端实体，不重复定义 */
import type { Route } from '@/api/types'

/** 回放帧：航线点位的视图模型 */
export interface ReplayFrame {
  pointOrder: number
  latitude: number
  longitude: number
  /** 途经点展示名（可选） */
  label?: string
  /** 该帧对应时间标签（可选，如 mm:ss） */
  time?: string
}

/** 回放倍速 */
export type ReplaySpeed = 0.5 | 1 | 2 | 4

/** 一条可回放的航线及其点位 */
export interface ReplayRoute {
  route: Route
  frames: ReplayFrame[]
}
