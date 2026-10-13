<template>
  <div class="emergency nx-panel">
    <div class="head">
      <span><el-icon><Warning /></el-icon>&nbsp;应急处置面板</span>
      <el-tag size="small" effect="dark" round :type="pending.length ? 'danger' : 'success'">
        待处理 {{ pending.length }}
      </el-tag>
    </div>

    <div v-if="loading" class="state"><el-skeleton :rows="4" animated /></div>
    <el-empty v-else-if="pending.length === 0" :image-size="70" description="无待处理告警，一切正常" />
    <ul v-else class="list">
      <li v-for="a in pending" :key="a.id" class="row" :style="{ borderLeftColor: LEVEL_COLOR[a.levelKey] }">
        <div class="row-main">
          <b>{{ a.shipName }}</b>
          <span class="rule">{{ a.ruleName }}</span>
        </div>
        <div class="row-meta">
          <span class="val" :style="{ color: LEVEL_COLOR[a.levelKey] }">{{ fmt(a.triggerValue) }}</span>
          <time>{{ a.alertTime || '--' }}</time>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAllAlertEvents, getAllAlertRecords } from '@/api/alert'
import { getAllShipsCached } from '@/api/ship'
import { levelOf, LEVEL_COLOR } from '@/types/alert'
import type { AlertEvent, AlertRecord, ShipInfo } from '@/api/types'
import type { EnrichedAlert } from '@/types/alert'

/** 应急面板：alertRecord/list + alert-event 中未处置项合并展示。 */
const pending = ref<EnrichedAlert[]>([])
const loading = ref(true)
const ships = ref<ShipInfo[]>([])

function nameOf(shipId?: number) {
  if (shipId == null) return '未知船舶'
  const hit = ships.value.find(s => s.id === shipId)
  return hit?.shipName || `#${shipId}`
}

async function load() {
  loading.value = true
  const [records, events, shipList] = await Promise.all([
    getAllAlertRecords().catch(() => [] as AlertRecord[]),
    getAllAlertEvents().catch(() => [] as AlertEvent[]),
    getAllShipsCached().catch(() => [] as ShipInfo[]),
  ])
  ships.value = Array.isArray(shipList) ? shipList : []

  const out: EnrichedAlert[] = (Array.isArray(records) ? records : [])
    .filter(r => r.handleStatus !== 1)
    .map(r => enrich(r))

  // alert-event status!=1 视为进行中事件，折算成统一行结构
  for (const e of (Array.isArray(events) ? events : []).filter(ev => ev.status !== 1).slice(0, 20)) {
    out.push(enrich({
      id: -e.id!,
      shipId: e.shipId,
      ruleId: e.ruleId,
      triggerValue: e.maxValue != null ? Number(e.maxValue) : undefined,
      alertTime: e.startTime,
      handleStatus: 0,
    }))
  }

  out.sort((x, y) => (y.alertTime || '').localeCompare(x.alertTime || ''))
  pending.value = out.slice(0, 30)
  loading.value = false
}

function enrich(r: AlertRecord): EnrichedAlert {
  return {
    ...r,
    shipName: nameOf(r.shipId),
    ruleName: r.ruleId != null ? `规则#${r.ruleId}` : '未知规则',
    alertLevel: null,
    levelKey: levelOf(null),
  }
}
function fmt(v?: number | null) {
  return v == null || Number.isNaN(Number(v)) ? '--' : Number(v).toFixed(1)
}

onMounted(load)
</script>

<style scoped>
.emergency { padding: 16px 18px; border-radius: 14px; display: flex; flex-direction: column; min-height: 0; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; color: #e2e8f0; font-weight: 600; font-size: 14px; }
.head span { display: inline-flex; align-items: center; }
.head .el-icon { color: #fb7185; }
.state { padding: 10px 0; }
.list { list-style: none; margin: 0; padding: 0; overflow-y: auto; max-height: 340px; display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; border-left: 3px solid #fb7185; border-radius: 8px; background: rgba(15, 30, 55, 0.55); }
.row-main { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.row-main b { color: #f1f5f9; font-size: 13.5px; }
.rule { color: #94a3b8; font-size: 12px; }
.row-meta { text-align: right; display: flex; flex-direction: column; gap: 2px; flex: none; }
.val { font-family: Consolas, monospace; font-weight: 700; font-size: 14px; }
time { color: #64748b; font-size: 11.5px; }
</style>
