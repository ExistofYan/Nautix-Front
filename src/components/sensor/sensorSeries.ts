import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { SensorConfig, SensorData } from '@/api/types'
import type { SensorPoint } from '@/types/sensor'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'

/** 按关键字匹配传感器：名称或类型名包含任一关键词（大小写不敏感） */
export function matchKeyword(c: SensorConfig, keys: string[]): boolean {
  const name = (c.sensorName || '').toLowerCase()
  return keys.some(k => name.includes(k.toLowerCase()))
}

/**
 * 从 trend 缓存中挑选符合谓词的传感器序列，合并为一条时间轴上的多线数据。
 * SensorChart 是单线组件，这里把所有命中读数按时间排序合成一条"主传感器"线；
 * 若命中多个 config，则取样本数最多的那个为主展示，其余计数提示。
 */
export function useSensorSeries(
  predicate: (c: SensorConfig) => boolean,
  shipIdGetter: () => number | undefined,
): { points: ComputedRef<SensorPoint[]>; unit: ComputedRef<string>; seriesCount: ComputedRef<number> } {
  const sensorStore = useSensorStore()
  const dataStore = useSensorDataStore()

  const matchedConfigs = computed(() => {
    const shipId = shipIdGetter()
    return sensorStore.configs.filter(c => {
      if (!predicate(c)) return false
      if (shipId != null && c.shipId !== shipId) return false
      return true
    })
  })

  const seriesCount = computed(() => matchedConfigs.value.length)

  /** 选样本最多的 config 作为主线 */
  const primary = computed(() => {
    let best: { id: number; len: number } | null = null
    for (const c of matchedConfigs.value) {
      if (c.id == null) continue
      const len = dataStore.seriesByConfig.get(c.id)?.length ?? 0
      if (!best || len > best.len) best = { id: c.id, len }
    }
    return best
  })

  const points = computed<SensorPoint[]>(() => (primary.value ? dataStore.pointsOf(primary.value.id) : []))

  const unit = computed(() => {
    const c = primary.value ? sensorStore.configOf(primary.value.id) : undefined
    return c ? sensorStore.unitOf(c.typeId) : ''
  })

  return { points, unit, seriesCount }
}

/** 把多个 config 的读数摊平为统一行（供表格/统计用） */
export function flattenReadings(rows: SensorData[]): SensorData[] {
  return [...rows].sort((a, b) => (a.recordedAt || '').localeCompare(b.recordedAt || ''))
}
