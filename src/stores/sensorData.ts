import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSensorTrendData, getSensorVolatility } from '@/api/sensor'
import type { SensorData } from '@/api/types'
import type { AnomalyRow, SensorPoint, VolatilityStat } from '@/types/sensor'
import { useSensorStore } from '@/stores/sensor'
import { useShipStore } from '@/stores/shipStore'

/** 离散系数阈值：stdDev 超过 |mean| 的 5% 视为异常波动 */
export const CV_THRESHOLD = 0.05

/**
 * trend / volatility 缓存：
 * - loadTrend(limit)：最近 N 条传感器读数（全船混排），按 configId 分组供图表使用
 * - loadVolatility()：稳定性统计，join 配置与船名后产出异常榜行
 */
export const useSensorDataStore = defineStore('sensorData', () => {
  const trend = ref<SensorData[]>([])
  const volatility = ref<VolatilityStat[]>([])
  const trendLoading = ref(false)
  const volLoading = ref(false)

  /** configId → 时间升序读数序列 */
  const seriesByConfig = computed(() => {
    const m = new Map<number, SensorData[]>()
    for (const d of trend.value) {
      if (d.configId == null) continue
      const arr = m.get(d.configId) ?? []
      arr.push(d)
      m.set(d.configId, arr)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => (a.recordedAt || '').localeCompare(b.recordedAt || ''))
    }
    return m
  })

  function pointsOf(configId?: number): SensorPoint[] {
    if (configId == null) return []
    return (seriesByConfig.value.get(configId) ?? []).map(d => ({
      t: (d.recordedAt || '').slice(5, 19),
      v: d.dataValue ?? 0,
    }))
  }

  /**
   * 把 volatility join 配置/字典/船名，产出带异常标记的行（stdDev 降序）。
   * 优先用后端 join 带出的 sensorName/shipId（前端配置为限量加载，
   * 本地 configOf 对超出 limit 的 config 会取不到名字）。
   */
  const anomalyRows = computed<AnomalyRow[]>(() => {
    const sensor = useSensorStore()
    const ship = useShipStore()
    return volatility.value
      .map(v => {
        const cfg = sensor.configOf(v.configId)
        const mean = v.mean
        const std = v.stdDev
        let cv: number | null = null
        if (std != null && mean != null && Math.abs(mean) > 1e-9) cv = std / Math.abs(mean)
        const shipId = cfg?.shipId ?? v.shipId ?? undefined
        return {
          ...v,
          sensorName: cfg ? sensor.nameOf(cfg.id) : (v.sensorName || `#${v.configId}`),
          shipId,
          shipName: shipId != null ? ship.shipMap.get(shipId)?.shipName || `#${shipId}` : undefined,
          unit: cfg ? sensor.unitOf(cfg.typeId) : '',
          cv,
          abnormal: cv != null && cv > CV_THRESHOLD,
        }
      })
      .sort((a, b) => (b.stdDev ?? -1) - (a.stdDev ?? -1))
  })

  /**
   * 拉取趋势数据。
   * 全站最新 N 条几乎全是不同 config（每路仅 1~2 点），画不出线；
   * 必须传 shipId 才能拿到该船 16 类传感器的连续序列。
   */
  async function loadTrend(limit = 400, shipId?: number) {
    trendLoading.value = true
    try {
      const res = await getSensorTrendData(limit, shipId)
      trend.value = Array.isArray(res) ? res : []
    } catch {
      trend.value = []
    } finally {
      trendLoading.value = false
    }
  }

  /**
   * 拉取波动率统计（后端 SQL 聚合，限量）。
   * scan 语义随 shipId 变化：全站=主键窗口行数，单船=该船最近读数条数。
   */
  async function loadVolatility(scan = 200000, shipId?: number) {
    volLoading.value = true
    try {
      const res = await getSensorVolatility(scan, 300, shipId)
      volatility.value = Array.isArray(res) ? res : []
    } catch {
      volatility.value = []
    } finally {
      volLoading.value = false
    }
  }

  return {
    trend,
    volatility,
    trendLoading,
    volLoading,
    seriesByConfig,
    pointsOf,
    anomalyRows,
    loadTrend,
    loadVolatility,
  }
})
