import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchCommandSnapshot } from '@/api/command'
import { levelOf } from '@/types/alert'
import type { AlertRecord, ShipInfo, ShipRuntimeStatus } from '@/api/types'
import type { CommandStats, HourPoint, KpiItem, ShipRow, StatusBadgeItem, TickerItem } from '@/types/command'

/**
 * 指挥中心数据中枢：缓存快照（stats/runtime/ships/recentAlerts/hourDist），
 * 派生 KPI 墙、告警滚动条、船位表、状态分布。轮询由 useCommand hook 管理。
 */
export const useCommandStore = defineStore('command', () => {
  const stats = ref<CommandStats | null>(null)
  const runtime = ref<ShipRuntimeStatus[]>([])
  const ships = ref<ShipInfo[]>([])
  const recentAlerts = ref<AlertRecord[]>([])
  const hourDist = ref<HourPoint[]>([])
  const lastRefresh = ref<number | null>(null)
  const loading = ref(false)

  const shipMap = computed(() => new Map(ships.value.map(s => [s.id as number, s])))

  function shipNameOf(shipId?: number): string {
    if (shipId == null) return '未知船舶'
    return shipMap.value.get(shipId)?.shipName || `#${shipId}`
  }

  /** 待处理告警（handleStatus !== 1）数量，优先取后端 stats.alertCount。 */
  const pendingAlertCount = computed(() => {
    if (stats.value && Number.isFinite(stats.value.alertCount)) return stats.value.alertCount
    return recentAlerts.value.filter(a => a.handleStatus !== 1).length
  })

  /** KPI 墙数据源（6 卡）。平均航速/主机负荷来自 runtime。 */
  const kpis = computed<KpiItem[]>(() => {
    const avgSpeed = mean(runtime.value.map(r => r.speed))
    const avgLoad = mean(runtime.value.map(r => r.engineLoad))
    return [
      { key: 'ships', label: '在管船舶', value: stats.value?.shipCount ?? runtime.value.length, unit: '艘', precision: 0, icon: 'Ship', tone: 'cyan' },
      { key: 'alerts', label: '未处理告警', value: pendingAlertCount.value, unit: '条', precision: 0, icon: 'Bell', tone: 'red' },
      { key: 'sensors', label: '传感器配置', value: stats.value?.sensorConfigCount ?? 0, unit: '个', precision: 0, icon: 'Odometer', tone: 'violet' },
      { key: 'weather', label: '天气区域', value: stats.value?.weatherCount ?? 0, unit: '区', precision: 0, icon: 'PartlyCloudy', tone: 'blue' },
      { key: 'speed', label: '船队平均航速', value: avgSpeed, unit: 'kn', precision: 1, icon: 'Stopwatch', tone: 'green' },
      { key: 'load', label: '平均主机负荷', value: avgLoad, unit: '%', precision: 1, icon: 'Cpu', tone: 'amber' },
    ]
  })

  /** 滚动告警条：前 8 条 + 船名/规则解析。规则名暂以 #id 兜底（无独立 rule 拉取需求）。 */
  const tickerItems = computed<TickerItem[]>(() =>
    recentAlerts.value.slice(0, 8).map(a => ({
      ...a,
      shipName: shipNameOf(a.shipId),
      ruleName: a.ruleId != null ? `规则#${a.ruleId}` : '未知规则',
      levelKey: levelOf(null),
    }))
  )

  /** 船位表行。 */
  const shipRows = computed<ShipRow[]>(() =>
    runtime.value.map(r => ({ ...r, shipName: shipNameOf(r.shipId) }))
  )

  /** 航行状态分布徽章。 */
  const statusDist = computed<StatusBadgeItem[]>(() => {
    const m = new Map<string, number>()
    for (const r of runtime.value) {
      const k = r.sailingStatus || '未知'
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  })

  async function refreshAll() {
    loading.value = true
    try {
      const snap = await fetchCommandSnapshot()
      stats.value = snap.stats
      runtime.value = snap.runtime
      ships.value = snap.ships
      recentAlerts.value = snap.recentAlerts
      hourDist.value = snap.hourDist
      lastRefresh.value = snap.fetchedAt
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    runtime,
    ships,
    recentAlerts,
    hourDist,
    lastRefresh,
    loading,
    shipMap,
    shipNameOf,
    pendingAlertCount,
    kpis,
    tickerItems,
    shipRows,
    statusDist,
    refreshAll,
  }
})

function mean(nums: (number | undefined)[]): number {
  const valid = nums.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
  if (valid.length === 0) return 0
  return valid.reduce((s, n) => s + n, 0) / valid.length
}
