import io, sys, os
FE = 'D:/新建文件夹/java/javacode/nautix-frontend/src'

def P(rel, old, new, count=1):
    p = os.path.join(FE, rel.replace('/', os.sep))
    t = io.open(p, encoding='utf-8').read()
    n = t.count(old)
    if n < 1:
        print(f'MISS  {rel}  pattern not found: {old[:60]!r}')
        return False
    t2 = t.replace(old, new, count)
    io.open(p, 'w', encoding='utf-8', newline='').write(t2)
    print(f'OK    {rel}')
    return True

ok = True

# 1 api/replay.ts — getRoute 不存在，改用真实 getRouteDetail
ok &= P('api/replay.ts', "import { getRoute, getAllRoutePoints } from '@/api/ship'",
        "import { getAllRoutePoints } from '@/api/ship'\nimport { getRouteDetail } from '@/api/route'")
ok &= P('api/replay.ts', 'return await getRoute(routeId)', 'return await getRouteDetail(routeId)')

# 2 types/command.ts — 错误相对导入 './types'
ok &= P('types/command.ts', "from './types'", "from '@/api/types'")

# 3 InsightCard — Light 图标不存在 → Opportunity
ok &= P('components/ai/InsightCard.vue', 'import { TrendCharts, Warning, Light, DataAnalysis } from \'@element-plus/icons-vue\'',
        "import { TrendCharts, Warning, Opportunity, DataAnalysis } from '@element-plus/icons-vue'")
ok &= P('components/ai/InsightCard.vue', 'tip: markRaw(Light),', 'tip: markRaw(Opportunity),')

# 4 AlertCard — 可选 prop 函数可能 undefined
ok &= P('components/alert/AlertCard.vue', "{{ alert.shipName || shipNameOf(alert.shipId) }}",
        "{{ alert.shipName || (shipNameOf ? shipNameOf(alert.shipId) : '#' + (alert.shipId ?? '-')) }}")

# 5 EngineChart — 未用导入
ok &= P('components/sensor/EngineChart.vue', "import { computed } from 'vue'\nimport SensorChart",
        "import SensorChart")

# 6 SensorDashboard — yAxis data 可能 undefined
ok &= P('components/sensor/SensorDashboard.vue', 'data: d.map(r => r.sensorName).reverse(),',
        "data: d.map(r => r.sensorName ?? '').reverse(),")

# 7 SensorTree — 不安全断言
ok &= P('components/sensor/SensorTree.vue', 'String((data as SensorTreeNode).label ?? \'\')',
        "String((data as unknown as SensorTreeNode).label ?? '')")

# 8 CacheMonitor — fmtBytes 接受 null
ok &= P('components/system/CacheMonitor.vue', 'function fmtBytes(n: number): string {',
        "function fmtBytes(n: number | null): string {\n  if (n == null) return '--'")

# 9 TemperatureLayer — 未用变量 k ×2
ok &= P('components/weather/TemperatureLayer.vue', '    const k = x / 0.5\n', '')
ok &= P('components/weather/TemperatureLayer.vue', '  const k = (x - 0.5) / 0.5\n', '')

# 10 useMap — Partial 数值可能 undefined
ok &= P('hooks/useMap.ts', 'longitude: initial ? (initial.minLon + initial.maxLon) / 2 : 0,',
        'longitude: initial ? ((initial.minLon ?? 0) + (initial.maxLon ?? 0)) / 2 : 0,')
ok &= P('hooks/useMap.ts', 'latitude: initial ? (initial.minLat + initial.maxLat) / 2 : 10,',
        'latitude: initial ? ((initial.minLat ?? 0) + (initial.maxLat ?? 0)) / 2 : 10,')

# 11 useMapData — 未用 onMounted
ok &= P('hooks/useMapData.ts', "import { computed, onMounted, reactive, ref } from 'vue'",
        "import { computed, reactive, ref } from 'vue'")

# 12 useSensor — sensors → configs
ok &= P('hooks/useSensor.ts', 'store.sensors.length', 'store.configs.length')

# 13 stores/alert — 缺导入 getAlertRecordPage / 未导出 ensureRefs / spread 可空
ok &= P('stores/alert.ts', "import { deleteAlertRecord, getAllAlertRecords, getAlertRulePage, updateAlertRecord } from '@/api/alert'",
        "import { deleteAlertRecord, getAllAlertRecords, getAlertRecordPage, getAlertRulePage, updateAlertRecord } from '@/api/alert'")
ok &= P('stores/alert.ts', '    load,\n    loadAll,', '    load,\n    ensureRefs,\n    loadAll,')
ok &= P('stores/alert.ts', 'if (current.value?.id === rec.id) current.value = { ...current.value, handleStatus: 1 }',
        'if (current.value && current.value.id === rec.id) current.value = { ...current.value, handleStatus: 1 }')

# 14 stores/analytics — 假端点 getAnalytics/AnalyticsData 不存在，重写为真实聚合
p = os.path.join(FE, 'stores', 'analytics.ts')
io.open(p, 'w', encoding='utf-8', newline='').write('''import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getFleetCompanyDist, type FleetRow } from '@/api/analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  const data = ref<FleetRow[]>([])
  const loading = ref(false)
  async function load() {
    loading.value = true
    try {
      data.value = await getFleetCompanyDist()
    } catch {
      data.value = []
    } finally {
      loading.value = false
    }
  }
  return { data, loading, load }
})
''')
print('OK    stores/analytics.ts (rewritten)')

# 15 AlertAnalysis — 未用 RuleAggRow
ok &= P('views/alert/AlertAnalysis.vue', "import { LEVEL_COLOR, levelOf, type EnrichedAlert, type RuleAggRow } from '@/types/alert'",
        "import { LEVEL_COLOR, levelOf, type EnrichedAlert } from '@/types/alert'")

# 16 AlertHistory — 模板 any 索引
ok &= P('views/alert/AlertHistory.vue',
        '<span class="lv" :style="{ color: LEVEL_COLOR[row.levelKey] }">{{ LEVEL_LABEL[row.levelKey] }}</span>',
        '<span class="lv" :style="{ color: (LEVEL_COLOR as Record<string, string>)[row.levelKey] }">{{ (LEVEL_LABEL as Record<string, string>)[row.levelKey] }}</span>')

# 17 AlertMap — MapPoint.triggerValue 收窄
ok &= P('views/alert/AlertMap.vue', '  triggerValue?: number | string', '  triggerValue?: number')

# 18 views/fleet/FleetReport.vue — 组件需要 fleet prop，重写页面
p = os.path.join(FE, 'views', 'fleet', 'FleetReport.vue')
io.open(p, 'w', encoding='utf-8', newline='').write('''<template>
  <div class="fleet-report-page nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><Document /></el-icon> 船队报告</h1>
      <el-select-v2 v-model="company" :options="options" filterable placeholder="选择船队" style="width: 280px" />
    </div>
    <FleetReportComp :fleet="fleet" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFleet } from '@/hooks/useFleet'
import FleetReportComp from '@/components/fleet/FleetReport.vue'

const { store } = useFleet()
const company = ref<string | undefined>(undefined)
const options = computed(() => store.fleets.map(f => ({ value: f.company, label: `${f.company}（${f.memberCount} 艘）` })))
const fleet = computed(() => store.fleets.find(f => f.company === company.value) ?? null)
</script>

<style scoped>
.fleet-report-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
</style>
''')
print('OK    views/fleet/FleetReport.vue (rewritten)')

# 19 views/route/RouteAnimation.vue — store 无 profiles
ok &= P('views/route/RouteAnimation.vue', 'v-loading="store.loading && !profiles.length"',
        'v-loading="store.loading && !store.routes.length"')

# 20 Simulator.vue — getSensorTrendData 在 api/sensor
ok &= P('views/simulator/Simulator.vue', "import { getAllShips, getSensorTrendData } from '@/api/ship'",
        "import { getAllShips } from '@/api/ship'\nimport { getSensorTrendData } from '@/api/sensor'")

# 21 Cache.vue — 模板里 new Blob 不可用
ok &= P('views/system/Cache.vue', '{{ new Blob([row.key + row.value]).size }} B', '{{ bytesOf(row) }} B')
ok &= P('views/system/Cache.vue', "const allKeys = ref<KV[]>([])",
        "const allKeys = ref<KV[]>([])\n\nfunction bytesOf(kv: KV): number { return new Blob([kv.key + kv.value]).size }")

# 22 SimulatorMonitor.vue — 未用类型导入
ok &= P('views/system/SimulatorMonitor.vue', "import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'",
        "import type { ShipInfo } from '@/api/types'")

print('ALL_OK' if ok else 'SOME_MISSED')
