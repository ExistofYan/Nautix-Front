<template>
  <div class="nx-page sim-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Cpu /></el-icon> 模拟器监控</h2>
        <p class="nx-page-desc">数据产出速率、新鲜度与全船实时状态明细</p>
      </div>
      <el-button round :loading="loading" @click="loadAll"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <SimulatorMonitorComponent />

    <div class="nx-panel table-card">
      <div class="t-head">
        <span class="title">船舶实时状态表</span>
        <el-input v-model="kw" size="small" placeholder="按船名/IMO 过滤" clearable style="width: 200px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <el-table v-loading="loading" :data="filteredRows" size="small" stripe max-height="480">
        <el-table-column label="船舶" min-width="170">
          <template #default="{ row }">
            <div class="ship-cell">
              <b>{{ shipName(row.shipId) }}</b>
              <em>{{ shipImo(row.shipId) }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sailingStatus" label="航行状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="dark" :type="statusTag(row.sailingStatus)">{{ row.sailingStatus || '—' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置" width="190">
          <template #default="{ row }">{{ coord(row.latitude) }}, {{ coord(row.longitude) }}</template>
        </el-table-column>
        <el-table-column label="航速" width="90">
          <template #default="{ row }">{{ num(row.speed, 1) }} kn</template>
        </el-table-column>
        <el-table-column label="航向" width="80">
          <template #default="{ row }">{{ num(row.heading, 0) }}°</template>
        </el-table-column>
        <el-table-column label="主机负荷" width="150">
          <template #default="{ row }">
            <el-progress :percentage="clampPct(row.engineLoad)" :stroke-width="6" color="#a78bfa" />
          </template>
        </el-table-column>
        <el-table-column label="燃油" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="clampPct(row.fuelPercent)"
              :stroke-width="6"
              :color="clampPct(row.fuelPercent) < 20 ? '#fb7185' : '#34d399'"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后更新" width="160">
          <template #default="{ row }">{{ fmtTime(row.lastUpdate) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !filteredRows.length" description="暂无实时数据（后端未启动或模拟器关闭）" :image-size="80" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SimulatorMonitorComponent from '@/components/system/SimulatorMonitor.vue'
import { useRuntimeStore } from '@/stores/runtime'
import { getAllShipsCached } from '@/api/ship'
import type { ShipInfo } from '@/api/types'

const rt = useRuntimeStore()
const ships = ref<ShipInfo[]>([])
const kw = ref('')
const loading = computed(() => rt.rows.length === 0)

const shipMap = computed(() => {
  const m = new Map<number, ShipInfo>()
  for (const s of ships.value) if (s.id != null) m.set(s.id, s)
  return m
})

const filteredRows = computed(() => {
  const q = kw.value.trim().toLowerCase()
  if (!q) return rt.rows
  return rt.rows.filter(r => {
    const s = shipMap.value.get(r.shipId ?? -1)
    return (s?.shipName || '').toLowerCase().includes(q) || (s?.imo || '').toLowerCase().includes(q)
  })
})

function shipName(id?: number) { return id != null ? shipMap.value.get(id)?.shipName || `船 #${id}` : '—' }
function shipImo(id?: number) { return id != null ? shipMap.value.get(id)?.imo || '' : '' }
function statusTag(s?: string): 'success' | 'warning' | 'danger' | 'info' {
  const k = (s || '').toUpperCase()
  if (k.includes('SEA') || k.includes('NAVIGAT')) return 'success'
  if (k.includes('ALERT') || k.includes('EMER')) return 'danger'
  if (k.includes('PORT') || k.includes('DOCK')) return 'info'
  return 'warning'
}
function coord(v?: number) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(4) }
function num(v: number | undefined, d: number) { return v == null || Number.isNaN(v) ? '—' : v.toFixed(d) }
function clampPct(v?: number) { return Math.max(0, Math.min(100, Math.round(v ?? 0))) }
function fmtTime(t?: string) {
  if (!t) return '—'
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? t : d.toLocaleString('zh-CN', { hour12: false })
}

async function loadAll() {
  await rt.refresh()
  try { ships.value = (await getAllShipsCached()) ?? [] } catch { /* empty */ }
}

onMounted(loadAll)
</script>

<style scoped>
.sim-page { display: flex; flex-direction: column; gap: 18px; }
.table-card { padding: 18px 20px; border-radius: 14px; }
.t-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { color: var(--nx-text); font-weight: 700; font-size: 15px; }
.ship-cell { display: flex; flex-direction: column; line-height: 1.3; }
.ship-cell b { color: var(--nx-text); font-size: 13px; }
.ship-cell em { color: #64748b; font-style: normal; font-size: 11px; }
</style>
