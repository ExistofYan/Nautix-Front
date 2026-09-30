<template>
  <div class="fleet-status nx-panel">
    <el-table :data="rows" stripe size="default" max-height="420">
      <el-table-column prop="shipName" label="船名" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag size="small" effect="dark" round :type="statusType(row.runtime?.sailingStatus)">
            {{ row.runtime?.sailingStatus ?? '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="航速" width="100">
        <template #default="{ row }">{{ fmt(row.runtime?.speed) }} kn</template>
      </el-table-column>
      <el-table-column label="油量" min-width="160">
        <template #default="{ row }">
          <el-progress
            :percentage="row.runtime?.fuelPercent != null ? Math.round(row.runtime.fuelPercent) : 0"
            :stroke-width="10"
            :color="fuelColor(row.runtime?.fuelPercent)"
          />
        </template>
      </el-table-column>
      <el-table-column label="最后更新" width="170">
        <template #default="{ row }">
          <span class="ts">{{ (row.runtime?.lastUpdate ?? '').replace('T', ' ').slice(0, 19) || '--' }}</span>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无成员数据" :image-size="60" /></template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'

const props = defineProps<{ ships: ShipInfo[]; runtimeById: Record<number, ShipRuntimeStatus> }>()

const rows = computed(() =>
  props.ships.map(s => ({
    shipName: s.shipName ?? `船 #${s.id}`,
    runtime: s.id != null ? props.runtimeById[s.id] ?? null : null,
  }))
)

function statusType(st?: string) {
  if (!st) return 'info' as const
  if (/航行|sailing|underway/i.test(st)) return 'success' as const
  if (/锚|anchor|停泊/i.test(st)) return 'warning' as const
  if (/靠港|berth|port|dock/i.test(st)) return 'primary' as const
  return 'info' as const
}

function fuelColor(pct?: number | null) {
  if (pct == null) return '#475569'
  if (pct < 20) return '#fb7185'
  if (pct < 50) return '#fbbf24'
  return '#34d399'
}

const fmt = (n?: number | null) => (n == null ? '--' : n.toFixed(1))
</script>

<style scoped>
.fleet-status { border-radius: 14px; padding: 12px 14px; }
.ts { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 12px; color: #94a3b8; }
</style>
