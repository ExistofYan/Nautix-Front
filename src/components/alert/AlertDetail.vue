<template>
  <el-drawer
    :model-value="open"
    title="告警详情"
    size="420px"
    class="alert-drawer"
    @update:model-value="emit('update:open', $event)"
  >
    <template v-if="record">
      <div class="ad-head" :style="{ borderLeftColor: levelColor }">
        <span class="ad-level" :style="{ color: levelColor, background: levelColor + '1f' }">{{ levelLabel }}</span>
        <h3>{{ record.ruleName || `规则#${record.ruleId ?? '-'}` }}</h3>
        <el-tag :type="record.handleStatus === 1 ? 'success' : 'danger'" effect="dark" size="small" round>
          {{ record.handleStatus === 1 ? '已处理' : '待处理' }}
        </el-tag>
      </div>

      <el-descriptions :column="1" border class="ad-desc">
        <el-descriptions-item label="告警 ID">{{ record.id ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="船舶">{{ record.shipName || `#${record.shipId ?? '-'}` }}</el-descriptions-item>
        <el-descriptions-item label="触发规则">{{ record.ruleName || (record.ruleId != null ? `#${record.ruleId}` : '--') }}</el-descriptions-item>
        <el-descriptions-item label="规则等级">
          <span :style="{ color: levelColor, fontWeight: 700 }">{{ record.alertLevel ?? '--' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="触发值">
          <span class="ad-trigger">{{ fmtNum(record.triggerValue) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="告警时间">{{ record.alertTime || '--' }}</el-descriptions-item>
      </el-descriptions>

      <div class="ad-actions">
        <el-button
          v-if="record.handleStatus !== 1"
          type="success"
          round
          :loading="handling"
          @click="handleMark"
        >
          <el-icon><CircleCheck /></el-icon>标记已处理
        </el-button>
        <el-button round @click="emit('update:open', false)">关闭</el-button>
      </div>
    </template>
    <el-empty v-else description="未选择告警" />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAlertStore } from '@/stores/alert'
import { LEVEL_COLOR, LEVEL_LABEL, type EnrichedAlert } from '@/types/alert'

const props = defineProps<{
  open: boolean
  record?: EnrichedAlert | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'updated'): void
}>()

const store = useAlertStore()
const handling = ref(false)

const levelColor = computed(() => LEVEL_COLOR[props.record?.levelKey ?? 'info'])
const levelLabel = computed(() => LEVEL_LABEL[props.record?.levelKey ?? 'info'])

function fmtNum(v?: number | string | null) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toFixed(2)
}

async function handleMark() {
  if (!props.record?.id) return
  handling.value = true
  const ok = await store.markHandled(props.record)
  handling.value = false
  if (ok) {
    ElMessage.success('已标记为处理完成')
    emit('updated')
  } else {
    ElMessage.error('处置失败，请检查后端服务')
  }
}
</script>

<style scoped>
.ad-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 12px;
  border-left: 3px solid var(--nx-primary);
  margin-bottom: 18px;
}
.ad-head h3 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  color: var(--nx-text);
}
.ad-level {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.ad-desc {
  margin-bottom: 22px;
}
.ad-trigger {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--nx-amber);
  font-weight: 700;
}
.ad-actions {
  display: flex;
  gap: 10px;
}
</style>
