/* 船队数据源：后端无 /fleet 端点，用真实端点按运营公司聚合出船队视图。 */
import { getAllShipsCached, getAllRuntimeStatus } from '@/api/ship'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'
import type { Fleet } from '@/types/fleet'

const avg = (xs: number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length

/** 拉取并聚合全部船队（公司分组） */
export async function getFleetList(): Promise<Fleet[]> {
  const [ships, runtimes] = await Promise.all([getAllShipsCached(), getAllRuntimeStatus()])
  const runtimeById: Record<number, ShipRuntimeStatus> = {}
  for (const r of runtimes ?? []) {
    if (r.shipId != null) runtimeById[r.shipId] = r
  }

  const byCompany = new Map<string, ShipInfo[]>()
  for (const s of ships ?? []) {
    const key = (s.operatingCompany ?? '').trim() || '未登记公司'
    const arr = byCompany.get(key)
    if (arr) arr.push(s)
    else byCompany.set(key, [s])
  }

  const thisYear = new Date().getFullYear()
  const fleets: Fleet[] = []
  for (const [company, members] of byCompany) {
    const ids = members.map(m => m.id).filter((x): x is number => x != null)
    const rt = ids.map(id => runtimeById[id]).filter((x): x is ShipRuntimeStatus => !!x)
    fleets.push({
      company,
      ships: members,
      runtimeById,
      memberCount: members.length,
      avgSpeed: avg(rt.map(r => r.speed).filter((x): x is number => x != null)),
      avgFuel: avg(rt.map(r => r.fuelPercent).filter((x): x is number => x != null)),
      avgEngineLoad: avg(rt.map(r => r.engineLoad).filter((x): x is number => x != null)),
      avgShipAge: avg(
        members
          .map(m => (m.buildYear != null && m.buildYear > 1900 ? thisYear - m.buildYear : null))
          .filter((x): x is number => x != null)
      ),
    })
  }
  return fleets.sort((a, b) => b.memberCount - a.memberCount)
}
