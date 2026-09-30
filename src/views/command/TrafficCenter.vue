<template>
  <CommandLayout>
    <div class="tc-page">
      <div class="top">
        <TrafficMonitor />
        <GlobalShipCounter />
      </div>

      <div class="table-card nx-panel">
        <div class="head">
          <span><el-icon><Position /></el-icon>&nbsp;船位实时表</span>
          <el-tag size="small" effect="dark" round type="info">{{ store.shipRows.length }} 艘在报</el-tag>
        </div>
        <el-table v-if="store.shipRows.length" :data="store.shipRows" size="small" stripe height="420">
          <el-table-column prop="shipName" label="船名" min-width="150" show-overflow-tooltip />
          <el-table-column label="经度" width="110">
            <template #default="{ row }">{{ fmt(row.longitude, 4) }}</template>
          </el-table-column>
          <el-table-column label="纬度" width="110">
            <template #default="{ row }">{{ fmt(row.latitude, 4) }}</template>
          </el-table-column>
          <el-table-column label="航速(kn)" width="100">
            <template #default="{ row }">{{ fmt(row.speed, 1) }}</template>
          </el-table-column>
          <el-table-column label="航向(°)" width="95">
            <template #default="{ row }">{{ fmt(row.heading, 0) }}</template>
          </el-table-column>
          <el-table-column label="主机负荷(%)" width="130">
            <template #default="{ row }">
              <el-progress :percentage="clamp(row.engineLoad)" :stroke-width="8" :show-text="false" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="statusTone(row.sailingStatus)">{{ row.sailingStatus || '未知' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新" min-width="160" />
        </el-table>
        <el-empty v-else :image-size="70" description="暂无船位数据（后端未启动或无上报）" />
      </div>
    </div>
  </CommandLayout>
</template>

<script setup lang="ts">
import CommandLayout from '@/layouts/CommandLayout.vue'
import TrafficMonitor from '@/components/command/TrafficMonitor.vue'
import GlobalShipCounter from '@/components/command/GlobalShipCounter.vue'
import { useCommand } from '@/hooks/useCommand'

/** 交通中心：节律图 + 全球计数 + runtime 船位明细表。 */
const { store } = useCommand()

function fmt(v: number | undefined | null, d: number) {
  return v == null || Number.isNaN(Number(v)) ? '--' : Number(v).toFixed(d)
}
function clamp(v?: number | null) {
  if (v == null || Number.isNaN(Number(v))) return 0
  return Math.max(0, Math.min(100, Math.round(Number(v))))
}
function statusTone(s?: string): 'success' | 'warning' | 'danger' | 'info' {
  if (!s) return 'info'
  if (/锚|anchor/i.test(s)) return 'warning'
  if (/停|berth|moor/i.test(s)) return 'info'
  if (/航|underway|sail/i.test(s)) return 'success'
  return 'info'
}
</script>

<style scoped>
.tc-page { display: flex; flex-direction: column; gap: 18px; }
.top { display: grid; grid-template-columns: 3fr 2fr; gap: 18px; }
.table-card { padding: 16px 18px; border-radius: 14px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: #e2e8f0; font-weight: 600; font-size: 14px; }
.head span { display: inline-flex; align-items: center; }
.head .el-icon { color: #38bdf8; }
@media (max-width: 980px) { .top { grid-template-columns: 1fr; } }
</style>
