/* Port view models derived from the real Port entity ('@/api/types'). */
import type { Port } from '@/api/types'

/** A group of ports sharing one country — used by statistics. */
export interface PortCluster {
  country: string
  countryCode: string
  count: number
  ports: Port[]
}

/** One row of the port-type distribution table. */
export interface PortTypeRow {
  type: string
  count: number
  sharePct: number
}

/** Edge between two ports connected by at least one route (chord diagram). */
export interface PortConnectionEdge {
  startPortId: number
  endPortId: number
  routeCount: number
  totalDistanceNm: number
}
