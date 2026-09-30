<template>
  <div class="nx-panel log-card">
    <div class="head">
      <span class="title"><el-icon><Document /></el-icon> 操作日志</span>
      <div class="tools">
        <el-input
          v-model="userName"
          placeholder="按用户名过滤"
          size="small"
          clearable
          style="width: 160px"
          @keyup.enter="reload(1)"
          @clear="reload(1)"
        />
        <el-select-v2
          v-model="targetTable"
          :options="tableOptions"
          placeholder="目标表"
          size="small"
          clearable
          style="width: 150px"
          @change="reload(1)"
        />
        <el-switch v-model="follow" size="small" active-text="自动跟随" />
      </div>
    </div>

    <el-table v-loading="loading" :data="rows" size="small" stripe height="calc(100vh - 340px)">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userName" label="用户" width="110" show-overflow-tooltip />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-tag size="small" effect="dark" :type="opTag(row.operationType)">{{ row.operationType || '—' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="targetTable" label="目标表" width="150" show-overflow-tooltip />
      <el-table-column prop="targetId" label="记录 ID" width="90" />
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="变更内容" min-width="220">
        <template #default="{ row }">
          <span class="diff">
            <em class="old">{{ trunc(row.oldValue) }}</em>
            <el-icon><Right /></el-icon>
            <b class="new">{{ trunc(row.newValue) }}</b>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager-row">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        background
        small
        @current-change="reload(page)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getLogPage } from '@/api/system'
import type { SysOperationLog } from '@/api/types'

const rows = ref<SysOperationLog[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const loading = ref(false)
const userName = ref('')
const targetTable = ref('')
const follow = ref(false)

const tableOptions = [
  'ship_info', 'route', 'route_point', 'port', 'weather_region',
  'sensor_config', 'sensor_data', 'alert_rule', 'alert_record', 'sys_operation_log',
].map(v => ({ value: v, label: v }))

async function reload(to?: number) {
  if (to) page.value = to
  loading.value = true
  try {
    const res = await getLogPage({
      page: page.value,
      size: size.value,
      userName: userName.value || undefined,
      targetTable: targetTable.value || undefined,
    })
    rows.value = res.records ?? []
    total.value = res.total ?? 0
  } catch {
    /* silent — keep previous rows */
  } finally {
    loading.value = false
  }
}

let timer: number | undefined
watch(follow, (on) => {
  if (on) {
    timer = window.setInterval(() => { if (!loading.value) void reload(1) }, 8000)
  } else if (timer !== undefined) {
    clearInterval(timer)
    timer = undefined
  }
})
onMounted(() => void reload(1))
onUnmounted(() => { if (timer !== undefined) clearInterval(timer) })

function opTag(op?: string) {
  const o = (op || '').toUpperCase()
  if (o.includes('DELETE')) return 'danger' as const
  if (o.includes('INSERT') || o.includes('ADD') || o.includes('CREATE')) return 'success' as const
  if (o.includes('UPDATE') || o.includes('EDIT')) return 'warning' as const
  return 'info' as const
}
function fmtTime(t?: string) {
  if (!t) return '—'
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? t : d.toLocaleString('zh-CN', { hour12: false })
}
function trunc(s?: string) {
  if (!s) return '—'
  return s.length > 40 ? s.slice(0, 40) + '…' : s
}
</script>

<style scoped>
.log-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.tools { display: flex; align-items: center; gap: 10px; }
.diff { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; }
.diff .old { color: #fca5a5; font-style: normal; }
.diff .new { color: #86efac; font-weight: 500; }
.pager-row { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
