import { computed, reactive, ref } from 'vue'
import type { Port, RoutePoint, ShipInfo, ShipRuntimeStatus, WeatherRegion } from '@/api/types'
import { getAllPorts } from '@/api/port'
import { getRouteGeometry, type RouteGeometry } from '@/api/ship'
import { getAllShipsCached, getAllRuntimeStatus } from '@/api/ship'
import { getAllWeatherRegions } from '@/api/weather'
import { useMap } from '@/hooks/useMap'
import type { ChartViewerApi, LayerId } from '@/types/map'

/** 后端抽稀几何 → 前端 RoutePoint 结构（保持既有图层代码不变） */
function toRoutePoints(geoms: RouteGeometry[]): RoutePoint[] {
  const out: RoutePoint[] = []
  for (const g of geoms) {
    if (g.id == null || !Array.isArray(g.pts)) continue
    g.pts.forEach((pt, i) => {
      if (!pt || pt.length < 2) return
      out.push({ routeId: g.id, pointOrder: i + 1, longitude: pt[0], latitude: pt[1] } as RoutePoint)
    })
  }
  return out
}

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
  /** 是否已完成首帧加载：后台静默刷新时不再弹全屏 loading 遮罩 */
  const initialized = ref(false)
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

  async function load(background = false) {
    if (!background) loading.value = true
    try {
      const [ships, runtime, geoms, ports, weather] = await Promise.all([
        getAllShipsCached().catch(() => [] as ShipInfo[]),
        getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[]),
        getRouteGeometry({ limit: 600, stride: 6 }).catch(() => [] as RouteGeometry[]),
        getAllPorts().catch(() => [] as Port[]),
        getAllWeatherRegions().catch(() => [] as WeatherRegion[]),
      ])
      data.ships = Array.isArray(ships) ? ships : []
      data.runtime = Array.isArray(runtime) ? runtime : []
      data.points = toRoutePoints(Array.isArray(geoms) ? geoms : [])
      data.ports = Array.isArray(ports) ? ports : []
      data.weather = Array.isArray(weather) ? weather : []
      // 只有首次加载才自动适配视野；后台刷新保留用户当前视野，
      // 否则每 15 秒视野被强行拉回全球，用户正在看的区域会“跳走”
      if (!initialized.value && (data.points.length || data.runtime.length)) {
        map.fitPoints([
          ...data.points.map((p) => ({ longitude: p.longitude ?? 0, latitude: p.latitude ?? 0 })),
          ...data.runtime.map((r) => ({ longitude: r.longitude ?? 0, latitude: r.latitude ?? 0 })),
        ])
      }
      initialized.value = true
    } finally {
      if (!background) loading.value = false
    }
  }

  /**
   * 后台实时刷新：只更新船舶位置/状态。
   * 船舶档案、港口、航线几何、天气属于低频变化的静态数据，
   * 每次轮询都重拉（4MB+）并触发全图层重算重渲染是持续掉帧的主因，
   * 放在首帧与手动刷新里做即可。
   */
  async function loadRealtime() {
    if (!initialized.value) {
      await load()
      return
    }
    const runtime = await getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[])
    data.runtime = Array.isArray(runtime) ? runtime : []
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
    load, loadRealtime, toggleLayer,
  }
}
