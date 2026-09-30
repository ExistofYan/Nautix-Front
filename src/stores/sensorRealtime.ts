import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSensorTrendData } from '@/api/sensor'
import type { RealtimeReading } from '@/types/realtimeSensor'
import { useSensorStore } from '@/stores/sensor'

/**
 * 实时读数：轮询 /sensorData/trend?limit=20，
 * 对每个 configId 取最新值，与上一轮比较得到 delta/trend。
 */
export const useSensorRealtimeStore = defineStore('sensorRealtime', () => {
  const readings = ref<RealtimeReading[]>([])
  const polling = ref(false)
  const lastTick = ref<string>('')
  /** 上一轮各 config 的最新值（用于算 delta） */
  const prevValue = new Map<number, number>()

  let timer: number | undefined

  const sortedReadings = computed(() => [...readings.value].sort((a, b) => a.configId - b.configId))

  async function tick() {
    try {
      const res = await getSensorTrendData(20)
      const rows = Array.isArray(res) ? res : []
      // 按 recordedAt 升序，取每个 config 最后一条为最新
      const latest = new Map<number, { v: number; t: string; shipId?: number }>()
      for (const d of [...rows].sort((a, b) => (a.recordedAt || '').localeCompare(b.recordedAt || ''))) {
        if (d.configId == null || d.dataValue == null) continue
        latest.set(d.configId, { v: d.dataValue, t: d.recordedAt || '', shipId: d.shipId })
      }
      const sensor = useSensorStore()
      const next: RealtimeReading[] = []
      for (const [configId, cur] of latest) {
        const prev = prevValue.get(configId)
        const delta = prev == null ? null : cur.v - prev
        next.push({
          configId,
          sensorName: sensor.nameOf(configId),
          shipId: cur.shipId,
          unit: sensor.unitOf(sensor.configOf(configId)?.typeId),
          value: cur.v,
          delta,
          trend: delta == null || Math.abs(delta) < 1e-9 ? 'flat' : delta > 0 ? 'up' : 'down',
          time: cur.t.slice(11, 19) || cur.t,
        })
        prevValue.set(configId, cur.v)
      }
      readings.value = next
      lastTick.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    } catch {
      // 后端不可用：保留上一轮读数，不打断 UI
    }
  }

  function start(intervalMs = 5000) {
    if (timer != null) return
    polling.value = true
    void tick()
    timer = window.setInterval(() => void tick(), intervalMs)
  }

  function stop() {
    if (timer != null) {
      clearInterval(timer)
      timer = undefined
    }
    polling.value = false
  }

  return { readings, sortedReadings, polling, lastTick, tick, start, stop }
})
