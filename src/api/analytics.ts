import request from './axios'
import { getAllShipsCached, getAllRuntimeStatus } from './ship'
import { getRoutePage, getTopRoutesByDistance } from './route'
import { getAllPorts } from './port'
import { getAllAlertRecords, getAlertRulePage } from './alert'
import { getDashboardStats, getShipTypeDistribution, getAlertHourDistribution } from './dashboard'
import type { AlertRecord, AlertRule, Route, ShipInfo, ShipRuntimeStatus } from './types'

/* ---------- 本地类型（不依赖 types/analytics，避免跨组耦合） ---------- */

export interface AnalyticsBucket {
  key: string
  label: string
  count: number
}

export interface FleetRow {
  company: string
  shipCount: number
  avgSpeed: number | null
  avgFuel: number | null
}

export interface FuelStat {
  total: number
  lowCount: number
  buckets: AnalyticsBucket[]
}

export interface RuleTriggerRow {
  ruleId: number
  ruleName: string
  alertLevel: number | null
  count: number
  pending: number
}

/** 把连续数值分桶成直方图 */
export function histogram(values: number[], edges: number[], labeler: (lo: number, hi: number) => string): AnalyticsBucket[] {
  const buckets: AnalyticsBucket[] = []
  for (let i = 0; i < edges.length - 1; i++) {
    buckets.push({ key: `b${i}`, label: labeler(edges[i], edges[i + 1]), count: 0 })
  }
  for (const v of values) {
    for (let i = 0; i < edges.length - 1; i++) {
      if (v >= edges[i] && (i === edges.length - 2 ? v <= edges[i + 1] : v < edges[i + 1])) {
        buckets[i].count++
        break
      }
    }
  }
  return buckets
}

/* ---------- 派生分析（全部基于真实端点前端聚合） ---------- */

/** 船队规模分布：按运营公司聚合在管船舶数 */
export async function getFleetCompanyDist(): Promise<FleetRow[]> {
  const [ships, runtime] = await Promise.all([getAllShipsCached(), getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[])])
  const rtMap = new Map<number, ShipRuntimeStatus>()
  for (const r of runtime ?? []) if (r.shipId != null) rtMap.set(r.shipId, r)
  const groups = new Map<string, ShipInfo[]>()
  for (const s of ships ?? []) {
    const key = s.operatingCompany || '未知公司'
    const arr = groups.get(key) ?? []
    arr.push(s)
    groups.set(key, arr)
  }
  const rows: FleetRow[] = []
  for (const [company, list] of groups) {
    const speeds = list.map(s => rtMap.get(s.id ?? -1)?.speed).filter((n): n is number => typeof n === 'number')
    const fuels = list.map(s => rtMap.get(s.id ?? -1)?.fuelPercent).filter((n): n is number => typeof n === 'number')
    rows.push({
      company,
      shipCount: list.length,
      avgSpeed: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null,
      avgFuel: fuels.length ? fuels.reduce((a, b) => a + b, 0) / fuels.length : null,
    })
  }
  return rows.sort((a, b) => b.shipCount - a.shipCount)
}

/** 燃油存量分布 + 低油量告警口径 */
export async function getFuelDistribution(): Promise<FuelStat> {
  const runtime = await getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[])
  const fuels = (runtime ?? []).map(r => r.fuelPercent).filter((n): n is number => typeof n === 'number')
  const buckets = histogram(fuels, [0, 15, 30, 50, 75, 100.0001], (lo, hi) => `${Math.round(lo)}-${Math.min(100, Math.round(hi))}%`)
  return { total: fuels.length, lowCount: fuels.filter(v => v < 15).length, buckets }
}

/** 规则维度触发统计：records 聚合 ruleId → 规则名/等级 */
export async function getRuleTriggerStats(): Promise<RuleTriggerRow[]> {
  const [records, rulesRes] = await Promise.all([
    getAllAlertRecords().catch(() => [] as AlertRecord[]),
    getAlertRulePage({ page: 1, size: 100 }).catch(() => null),
  ])
  const ruleMap = new Map<number, AlertRule>()
  for (const r of rulesRes?.records ?? []) if (r.id != null) ruleMap.set(r.id, r)
  const agg = new Map<number, RuleTriggerRow>()
  for (const rec of records ?? []) {
    const rid = rec.ruleId ?? 0
    let row = agg.get(rid)
    if (!row) {
      const rule = ruleMap.get(rid)
      row = { ruleId: rid, ruleName: rule?.ruleName || `规则#${rid}`, alertLevel: rule?.alertLevel ?? null, count: 0, pending: 0 }
      agg.set(rid, row)
    }
    row.count++
    if (rec.handleStatus !== 1) row.pending++
  }
  return [...agg.values()].sort((a, b) => b.count - a.count)
}

/** 里程分布直方（全站航线） */
export async function getDistanceHistogram() {
  const res = await getRoutePage({ page: 1, count: 100 }).catch(() => null)
  const dists = (res?.records ?? []).map(r => r.distanceNm).filter((n): n is number => typeof n === 'number')
  return histogram(dists, [0, 100, 300, 600, 1000, 1500, 2500, 100000], (lo, hi) => `${Math.round(lo)}-${Math.round(Math.min(hi, 99999))} nm`)
}

/** 里程 × 点数散点数据源 */
export async function getRouteScatterData() {
  const [routesRes, points] = await Promise.all([
    getRoutePage({ page: 1, count: 100 }).catch(() => null),
    request.get<unknown, { id?: number; routeId?: number }[]>('/route-point').catch(() => [] as { id?: number; routeId?: number }[]),
  ])
  const cnt = new Map<number, number>()
  for (const p of points ?? []) if (p.routeId != null) cnt.set(p.routeId, (cnt.get(p.routeId) ?? 0) + 1)
  return (routesRes?.records ?? [])
    .filter((r): r is Route & { id: number } => r.id != null && typeof r.distanceNm === 'number')
    .map(r => ({ routeId: r.id, name: r.routeName ?? `#${r.id}`, distanceNm: r.distanceNm as number, pointCount: cnt.get(r.id) ?? 0 }))
}

/* 直接复用已有真实端点聚合 */
export { getTopRoutesByDistance, getDashboardStats, getShipTypeDistribution, getAlertHourDistribution, getAllPorts }
