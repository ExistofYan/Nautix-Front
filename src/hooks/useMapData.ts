import { computed, reactive, ref } from 'vue'
import type { Port, RoutePoint, ShipInfo, ShipRuntimeStatus, WeatherRegion } from '@/api/types'
import { getAllPorts } from '@/api/port'
import { getAllRoutePoints } from '@/api/ship'
import { getAllShips, getAllRuntimeStatus } from '@/api/ship'
import { getAllWeatherRegions } from '@/api/weather'
import { useMap } from '@/hooks/useMap'
import type { ChartViewerApi, LayerId } from '@/types/map'

export interface MapData {
  ships: ShipInfo[]
  runtime: ShipRuntimeStatus[]
  points: RoutePoint[]
  ports: Port[]
  weather: WeatherRegion[]
}

/**
 * 海图数据 + 图层开关聚合 hook。
 * 所有请求失败静默降级为空数组，绝不抛错阻塞渲染。
 */
export function useMapData() {
  const data = reactive<MapData>({
    ships: [],
    runtime: [],
    points: [],
    ports: [],
    weather: [],
  })
  const loading = ref(false)
  const visible = reactive<Record<LayerId, boolean>>({
    ocean: true,
    route: true,
    port: true,
    ship: true,
    traffic: false,
    alert: false,
    weather: false,
    heatmap: false,
  })
  const map = useMap()

  async function load() {
    loading.value = true
    const [ships, runtime, points, ports, weather] = await Promise.all([
      getAllShips().catch(() => [] as ShipInfo[]),
      getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[]),
      getAllRoutePoints().catch(() => [] as RoutePoint[]),
      getAllPorts().catch(() => [] as Port[]),
      getAllWeatherRegions().catch(() => [] as WeatherRegion[]),
    ])
    data.ships = Array.isArray(ships) ? ships : []
    data.runtime = Array.isArray(runtime) ? runtime : []
    data.points = Array.isArray(points) ? points : []
    data.ports = Array.isArray(ports) ? ports : []
    data.weather = Array.isArray(weather) ? weather : []
    if (data.points.length || data.runtime.length) {
      map.fitPoints([
        ...data.points.map((p) => ({ longitude: p.longitude ?? 0, latitude: p.latitude ?? 0 })),
        ...data.runtime.map((r) => ({ longitude: r.longitude ?? 0, latitude: r.latitude ?? 0 })),
      ])
    }
    loading.value = false
  }

  /** shipId → ShipInfo */
  const shipById = computed(() => {
    const m = new Map<number, ShipInfo>()
    for (const s of data.ships) if (s.id != null) m.set(s.id, s)
    return m
  })

  /** shipId → runtime */
  const runtimeByShip = computed(() => {
    const m = new Map<number, ShipRuntimeStatus>()
    for (const r of data.runtime) if (r.shipId != null) m.set(r.shipId, r)
    return m
  })

  /** routeId → 有序点位 */
  const pointsByRoute = computed(() => {
    const m = new Map<number, RoutePoint[]>()
    for (const p of data.points) {
      if (p.routeId == null) continue
      const arr = m.get(p.routeId) ?? []
      arr.push(p)
      m.set(p.routeId, arr)
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0))
    return m
  })

  function toggleLayer(id: LayerId) {
    visible[id] = !visible[id]
  }

  const viewerApi: ChartViewerApi = {
    focusShip(shipId: number) {
      const rt = runtimeByShip.value.get(shipId)
      if (rt && rt.longitude != null && rt.latitude != null) {
        map.setBounds({
          minLon: rt.longitude - 3, maxLon: rt.longitude + 3,
          minLat: rt.latitude - 2, maxLat: rt.latitude + 2,
        })
      }
    },
    fitAll() {
      map.reset()
    },
    zoomBy(factor: number) {
      map.zoomAt(factor)
    },
  }

  return {
    data, loading, visible, map, viewerApi,
    shipById, runtimeByShip, pointsByRoute,
    load, toggleLayer,
  }
}
