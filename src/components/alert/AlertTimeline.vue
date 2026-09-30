<template>
  <div class="alert-timeline nx-panel">
    <div class="at-title">
      <el-icon><Clock /></el-icon>
      <span>最近告警</span>
      <em>{{ items.length }} 条</em>
    </div>
    <el-scrollbar max-height="420px">
      <el-timeline v-if="items.length" class="at-list">
        <el-timeline-item
          v-for="a in items"
          :key="a.id ?? `${a.shipId}-${a.alertTime}`"
          :color="LEVEL_COLOR[a.levelKey]"
          :timestamp="a.alertTime || ''"
          placement="top"
          size="normal"
        >
          <div class="at-item" @click="emit('select', a)">
            <div class="at-row1">
              <b>{{ a.shipName || `#${a.shipId ?? '-'}` }}</b>
              <el-tag v-if="a.handleStatus !== 1" size="small" type="danger" effect="dark">待处理</el-tag>
            </div>
            <div class="at-rule">{{ a.ruleName || `规则#${a.ruleId ?? '-'}` }}</div>
            <div class="at-val">触发值 {{ fmtNum(a.triggerValue) }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无告警记录" :image-size="70" />
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LEVEL_COLOR, type EnrichedAlert } from '@/types/alert'

const props = defineProps<{
  alerts: EnrichedAlert[]
  limit?: number
}>()

const emit = defineEmits<{
  (e: 'select', alert: EnrichedAlert): void
}>()

const items = computed(() => {
  const sorted = [...props.alerts].sort((a, b) => (b.alertTime || '').localeCompare(a.alertTime || ''))
  return props.limit ? sorted.slice(0, props.limit) : sorted
})

function fmtNum(v?: number | string | null) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toFixed(2)
}
</script>

<style scoped>
.alert-timeline {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.at-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
}
.at-title em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  color: #7d93b8;
}
.at-list {
  padding-left: 4px;
}
.at-item {
  cursor: pointer;
  border-radius: 8px;
  padding: 6px 8px;
  transition: background 0.15s ease;
}
.at-item:hover {
  background: rgba(56, 189, 248, 0.08);
}
.at-row1 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--nx-text);
  font-size: 13.5px;
}
.at-rule {
  font-size: 12px;
  color: var(--nx-text-dim);
  margin-top: 2px;
}
.at-val {
  font-size: 11.5px;
  color: var(--nx-amber);
  font-family: 'JetBrains Mono', Consolas, monospace;
  margin-top: 2px;
}
</style>
