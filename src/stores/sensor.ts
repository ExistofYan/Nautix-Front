import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getAllSensorConfigs, getAllSensorDicts } from '@/api/sensor'
import type { SensorConfig, SensorDict } from '@/api/types'
import type { ConfigWithDict } from '@/types/sensor'

/**
 * 传感器配置 + 字典缓存：
 * - configs：全部传感器安装配置（/sensorConfig）
 * - dicts：传感器类型字典（/sensorDict/list），typeId → dict 映射
 * - unitOf / nameOf / configsOfShip：常用查询
 */
export const useSensorStore = defineStore('sensor', () => {
  const configs = ref<SensorConfig[]>([])
  const dicts = ref<SensorDict[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  const dictById = computed(() => {
    const m = new Map<number, SensorDict>()
    for (const d of dicts.value) if (d.id != null) m.set(d.id, d)
    return m
  })

  const configById = computed(() => {
    const m = new Map<number, SensorConfig>()
    for (const c of configs.value) if (c.id != null) m.set(c.id, c)
    return m
  })

  /** typeId → 单位（无字典时回退空串） */
  function unitOf(typeId?: number): string {
    if (typeId == null) return ''
    return dictById.value.get(typeId)?.defaultUnit ?? ''
  }

  function typeNameOf(typeId?: number): string | undefined {
    if (typeId == null) return undefined
    return dictById.value.get(typeId)?.typeName
  }

  function configOf(configId?: number): SensorConfig | undefined {
    if (configId == null) return undefined
    const hit = configById.value.get(configId)
    if (hit) return hit
    // 全站列表被限量时，从按船缓存里兜底查找
    for (const arr of Object.values(shipConfigs.value)) {
      const c = arr.find(x => x.id === configId)
      if (c) return c
    }
    return undefined
  }

  function nameOf(configId?: number): string {
    const c = configOf(configId)
    if (!c) return `#${configId ?? '-'}`
    return c.sensorName || `${typeNameOf(c.typeId) ?? '传感器'} #${c.id}`
  }

  /**
   * 某船的传感器配置。
   * 全站 configs 已被后端限量（16 万条只回前若干），
   * 单船页面若只靠它过滤，大概率一条都取不到，
   * 因此按船单独拉一次并缓存（每船仅 16 条）。
   */
  const shipConfigCache = new Map<number, SensorConfig[]>()
  const shipConfigs = ref<Record<number, SensorConfig[]>>({})

  function configsOfShip(shipId?: number): SensorConfig[] {
    if (shipId == null) return configs.value
    const cached = shipConfigs.value[shipId] ?? shipConfigCache.get(shipId)
    if (cached) return cached
    return configs.value.filter(c => c.shipId === shipId)
  }

  async function ensureShipConfigs(shipId?: number) {
    if (shipId == null) return
    if (shipConfigs.value[shipId]?.length) return
    try {
      const list = await getAllSensorConfigs(shipId, 200)
      const arr = Array.isArray(list) ? list : []
      shipConfigCache.set(shipId, arr)
      shipConfigs.value = { ...shipConfigs.value, [shipId]: arr }
    } catch {
      /* 失败时回退到全站限量结果过滤 */
    }
  }

  function withDict(c: SensorConfig): ConfigWithDict {
    return {
      ...c,
      dict: c.typeId != null ? dictById.value.get(c.typeId) : undefined,
      unit: unitOf(c.typeId),
      typeName: typeNameOf(c.typeId),
    }
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      const [cfgRes, dictRes] = await Promise.all([getAllSensorConfigs(), getAllSensorDicts()])
      configs.value = Array.isArray(cfgRes) ? cfgRes : []
      dicts.value = Array.isArray(dictRes) ? dictRes : []
      loaded.value = true
    } catch {
      // 后端不可用时保持空态，页面渲染 el-empty
    } finally {
      loading.value = false
    }
  }

  return {
    configs,
    dicts,
    loaded,
    loading,
    dictById,
    configById,
    unitOf,
    typeNameOf,
    configOf,
    nameOf,
    configsOfShip,
    ensureShipConfigs,
    withDict,
    load,
  }
})
