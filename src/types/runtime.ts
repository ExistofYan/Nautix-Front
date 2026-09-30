/* System-monitoring view models. Entities themselves live in '@/api/types' —
 * never redefine them here; only derive UI-level shapes from them. */
import type { ShipRuntimeStatus } from '@/api/types'

/** One gateway probe result kept in the rolling history buffer. */
export interface LatencyPoint {
  t: number
  rttMs: number
  ok: boolean
}

/** Freshness bucket for the fleet data feed (used by QueueMonitor). */
export interface FreshnessBucket {
  label: string
  count: number
  /** bucket color token */
  tone: 'green' | 'cyan' | 'amber' | 'red'
}

/** Derived per-ship freshness row for tables. */
export interface RuntimeFreshRow {
  shipId: number
  lastUpdate?: string
  ageSec: number
  sailingStatus?: string
}

/** Pipeline node counters for the SVG pipeline view. */
export interface PipelineNode {
  id: string
  label: string
  sub: string
  value: number
  unit: string
  tone: 'cyan' | 'violet' | 'green' | 'amber'
}

/** Simulator throughput summary. */
export interface SimThroughput {
  rowsPerMinute: number
  latestStamp: number | null
  shipsReporting: number
  statusDist: { status: string; count: number }[]
}

export type { ShipRuntimeStatus }
