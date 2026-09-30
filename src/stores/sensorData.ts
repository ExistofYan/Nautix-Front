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

  /** 把 volatility join 配置/字典/船名，产出带异常标记的行（stdDev 降序） */
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
        return {
          ...v,
          sensorName: cfg ? sensor.nameOf(cfg.id) : `#${v.configId}`,
          shipId: cfg?.shipId,
          shipName: cfg?.shipId != null ? ship.shipMap.get(cfg.shipId)?.shipName || `#${cfg.shipId}` : undefined,
          unit: cfg ? sensor.unitOf(cfg.typeId) : '',
          cv,
          abnormal: cv != null && cv > CV_THRESHOLD,
        }
      })
      .sort((a, b) => (b.stdDev ?? -1) - (a.stdDev ?? -1))
  })

  async function loadTrend(limit = 200) {
    trendLoading.value = true
    try {
      const res = await getSensorTrendData(limit)
      trend.value = Array.isArray(res) ? res : []
    } catch {
      trend.value = []
    } finally {
      trendLoading.value = false
    }
  }

  async function loadVolatility(scan = 300000) {
    volLoading.value = true
    try {
      const res = await getSensorVolatility(scan)
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
