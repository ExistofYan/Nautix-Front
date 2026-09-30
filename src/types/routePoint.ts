/* Lightweight route-point shapes for map/layer rendering.
 * The canonical entity stays in '@/api/types' — never redefine it here. */
import type { Route, RoutePoint } from '@/api/types'

/** Minimal projected point used by SVG layers. */
export interface RoutePointLite {
  x: number
  y: number
  order: number
}

/** A route bundled with its ordered points — the unit consumed by layer components. */
export interface RouteWithPoints extends Route {
  points: RoutePoint[]
}

/** Ordered lite points after projection, ready for <polyline>. */
export interface ProjectedRoute {
  routeId: number
  name: string
  pts: RoutePointLite[]
}
