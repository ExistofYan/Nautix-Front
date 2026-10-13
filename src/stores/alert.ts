import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deleteAlertRecord, getAllAlertRecords, getAlertRecordPage, getAlertRulePage, updateAlertRecord } from '@/api/alert'
import { getAllShipsCached } from '@/api/ship'
import type { AlertRecord, AlertRule, ShipInfo } from '@/api/types'
import { levelOf, type EnrichedAlert, type RuleAggRow } from '@/types/alert'

export interface AlertFilters {
  shipId?: number
  handleStatus?: number
}

/**
 * 告警数据中枢：缓存 records / rules / ships，
 * 对外提供 join 后的 EnrichedAlert（含船名、规则名、等级色阶）。
 */
export const useAlertStore = defineStore('alert', () => {
  const records = ref<AlertRecord[]>([])
  const total = ref(0)
  const page = ref(1)
  const size = ref(20)
  const filters = ref<AlertFilters>({})
  const loading = ref(false)

  const ships = ref<ShipInfo[]>([])
  const rules = ref<AlertRule[]>([])
  const loadedAll = ref(false)
  const current = ref<EnrichedAlert | null>(null)

  const shipMap = computed(() => new Map(ships.value.map(s => [s.id as number, s])))
  const ruleMap = computed(() => new Map(rules.value.map(r => [r.id as number, r])))

  function shipNameOf(shipId?: number): string {
    if (shipId == null) return `#${shipId ?? '-'}`
    return shipMap.value.get(shipId)?.shipName || `#${shipId}`
  }

  function enrich(rec: AlertRecord): EnrichedAlert {
    const rule = rec.ruleId != null ? ruleMap.value.get(rec.ruleId) : undefined
    return {
      ...rec,
      shipName: shipNameOf(rec.shipId),
      ruleName: rule?.ruleName || (rec.ruleId != null ? `规则#${rec.ruleId}` : '未知规则'),
      alertLevel: rule?.alertLevel ?? null,
      levelKey: levelOf(rule?.alertLevel ?? null),
    }
  }

  /** 分页加载 records；rules/ships 只拉一次并缓存 */
  async function load(next?: { page?: number; size?: number; filters?: AlertFilters }) {
    if (next?.page) page.value = next.page
    if (next?.size) size.value = next.size
    if (next?.filters !== undefined) filters.value = next.filters
    loading.value = true
    try {
      await ensureRefs()
      const res = await getAlertRecordPage({
        page: page.value,
        size: size.value,
        shipId: filters.value.shipId,
        handleStatus: filters.value.handleStatus,
      })
      records.value = res.records ?? []
      total.value = res.total ?? 0
    } catch {
      records.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function ensureRefs() {
    if (loadedAll.value) return
    try {
      const [shipList, ruleRes] = await Promise.all([
        getAllShipsCached().catch(() => [] as ShipInfo[]),
        getAlertRulePage({ page: 1, size: 100 }).catch(() => null),
      ])
      ships.value = shipList ?? []
      rules.value = ruleRes?.records ?? []
      loadedAll.value = true
    } catch {
      /* 引用数据失败时保持空表，页面降级为 #id 展示 */
    }
  }

  /** 全量 records（分析页用），带缓存 */
  const allRecordsCache = ref<EnrichedAlert[] | null>(null)
  async function loadAll(): Promise<EnrichedAlert[]> {
    if (allRecordsCache.value) return allRecordsCache.value
    await ensureRefs()
    try {
      const list = await getAllAlertRecords()
      allRecordsCache.value = (list ?? []).map(enrich)
    } catch {
      allRecordsCache.value = []
    }
    return allRecordsCache.value
  }

  function invalidateAll() {
    allRecordsCache.value = null
  }

  /** 处置告警：handleStatus → 1 */
  async function markHandled(rec: AlertRecord): Promise<boolean> {
    try {
      await updateAlertRecord({ ...rec, handleStatus: 1 })
      invalidateAll()
      const idx = records.value.findIndex(r => r.id === rec.id)
      if (idx >= 0) records.value[idx] = { ...records.value[idx], handleStatus: 1 }
      if (current.value && current.value.id === rec.id) current.value = { ...current.value, handleStatus: 1 }
      return true
    } catch {
      return false
    }
  }

  async function remove(id: number): Promise<boolean> {
    try {
      await deleteAlertRecord(id)
      invalidateAll()
      records.value = records.value.filter(r => r.id !== id)
      total.value = Math.max(0, total.value - 1)
      return true
    } catch {
      return false
    }
  }

  /** 规则维度聚合（基于全量缓存） */
  function ruleAgg(list: EnrichedAlert[]): RuleAggRow[] {
    const agg = new Map<number, RuleAggRow>()
    for (const a of list) {
      const rid = a.ruleId ?? 0
      let row = agg.get(rid)
      if (!row) {
        const rule = ruleMap.value.get(rid)
        row = {
          ruleId: rid,
          ruleName: rule?.ruleName || `规则#${rid}`,
          alertLevel: rule?.alertLevel ?? null,
          count: 0,
          pending: 0,
        }
        agg.set(rid, row)
      }
      row.count++
      if (a.handleStatus !== 1) row.pending++
    }
    return [...agg.values()].sort((x, y) => y.count - x.count)
  }

  return {
    records,
    total,
    page,
    size,
    filters,
    loading,
    ships,
    rules,
    current,
    shipMap,
    ruleMap,
    shipNameOf,
    enrich,
    load,
    ensureRefs,
    loadAll,
    invalidateAll,
    markHandled,
    remove,
    ruleAgg,
  }
})
