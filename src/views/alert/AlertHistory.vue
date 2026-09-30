<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">告警历史</h2>
        <p class="nx-page-desc">全量告警记录检索与处置台账</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="nx-panel filter-bar">
      <el-select-v2
        v-model="filterShipId"
        :options="shipOptions"
        placeholder="选择船舶"
        clearable
        filterable
        style="width: 220px"
        @change="applyAndReload"
      />
      <el-select v-model="filterStatus" placeholder="处理状态" clearable style="width: 140px" @change="applyAndReload">
        <el-option label="待处理" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
      <span class="result-count">共 {{ total }} 条</span>
    </div>

    <div class="nx-panel table-card">
      <el-table
        v-loading="loading"
        :data="rows"
        stripe
        height="calc(100vh - 370px)"
        @row-click="openDetail"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="ex-row">
              <AlertCard :alert="row" @select="openDetail" />
              <div class="ex-meta">
                <div><em>告警 ID</em>{{ row.id ?? '--' }}</div>
                <div><em>规则 ID</em>{{ row.ruleId ?? '--' }}</div>
                <div><em>触发时间</em>{{ row.alertTime || '--' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="等级" width="90">
          <template #default="{ row }">
            <span class="lv" :style="{ color: (LEVEL_COLOR as Record<string, string>)[row.levelKey] }">{{ (LEVEL_LABEL as Record<string, string>)[row.levelKey] }}</span>
          </template>
        </el-table-column>
        <el-table-column label="船舶" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.shipName || `#${row.shipId ?? '-'}` }}</template>
        </el-table-column>
        <el-table-column label="触发规则" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.ruleName || (row.ruleId != null ? `#${row.ruleId}` : '--') }}</template>
        </el-table-column>
        <el-table-column label="触发值" width="120">
          <template #default="{ row }"><span class="tv">{{ fmtNum(row.triggerValue) }}</span></template>
        </el-table-column>
        <el-table-column prop="alertTime" label="告警时间" min-width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.handleStatus === 1 ? 'success' : 'danger'" effect="dark" size="small">
              {{ row.handleStatus === 1 ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.handleStatus !== 1" link type="success" size="small" @click.stop="markHandled(row)">标记已处理</el-button>
            <el-button link type="primary" size="small" @click.stop="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <AlertDetail v-model:open="drawerOpen" :record="selected" @updated="reload" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAlertStore } from '@/stores/alert'
import AlertCard from '@/components/alert/AlertCard.vue'
import AlertDetail from '@/components/alert/AlertDetail.vue'
import { LEVEL_COLOR, LEVEL_LABEL, type EnrichedAlert } from '@/types/alert'

const store = useAlertStore()

const loading = computed(() => store.loading)
const rows = computed(() => store.records.map(store.enrich))
const total = computed(() => store.total)
const page = ref(1)
const size = ref(20)
const filterShipId = ref<number>()
const filterStatus = ref<number>()

const drawerOpen = ref(false)
const selected = ref<EnrichedAlert | null>(null)

const shipOptions = computed(() =>
  store.ships.map(s => ({ value: s.id as number, label: `${s.shipName} (${s.id})` }))
)

function fmtNum(v?: number | string | null) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toFixed(2)
}

async function reload() {
  await store.load({ page: page.value, size: size.value })
}

async function applyAndReload() {
  page.value = 1
  await store.load({ page: 1, filters: { shipId: filterShipId.value, handleStatus: filterStatus.value } })
}

async function onPageChange(p: number) {
  page.value = p
  await store.load({ page: p })
}

async function onSizeChange(s: number) {
  size.value = s
  await store.load({ size: s, page: 1 })
}

function openDetail(row: EnrichedAlert) {
  selected.value = row
  store.current = row
  drawerOpen.value = true
}

async function markHandled(row: EnrichedAlert) {
  const ok = await store.markHandled(row)
  if (ok) ElMessage.success('已标记为处理完成')
  else ElMessage.error('处置失败，请检查后端服务')
}

onMounted(async () => {
  await store.ensureRefs()
  await reload()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.result-count {
  margin-left: auto;
  font-size: 12.5px;
  color: #7d93b8;
}
.table-card {
  padding: 12px 14px;
}
.lv {
  font-weight: 700;
  font-size: 12.5px;
}
.tv {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--nx-amber);
}
.ex-row {
  display: flex;
  gap: 18px;
  align-items: stretch;
  padding: 10px 16px;
}
.ex-row :deep(.alert-card) {
  width: 320px;
  flex: none;
}
.ex-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  font-size: 13px;
  color: var(--nx-text-dim);
}
.ex-meta em {
  font-style: normal;
  color: #7d93b8;
  margin-right: 8px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
