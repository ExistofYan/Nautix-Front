<template>
  <div class="alert-card nx-panel" :style="{ borderLeftColor: levelColor }" @click="emit('select', alert)">
    <div class="ac-head">
      <span class="ac-level" :style="{ color: levelColor, background: levelColor + '1f' }">{{ levelLabel }}</span>
      <span class="ac-ship">{{ alert.shipName || (shipNameOf ? shipNameOf(alert.shipId) : '#' + (alert.shipId ?? '-')) }}</span>
      <el-tag v-if="alert.handleStatus === 1" size="small" type="success" effect="plain">已处理</el-tag>
      <el-tag v-else size="small" type="danger" effect="dark">待处理</el-tag>
    </div>
    <div class="ac-rule">{{ alert.ruleName || `规则#${alert.ruleId ?? '-'}` }}</div>
    <div class="ac-foot">
      <span class="ac-value">触发值 <b>{{ fmtNum(alert.triggerValue) }}</b></span>
      <span class="ac-time" :title="alert.alertTime || ''">{{ relTime(alert.alertTime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LEVEL_COLOR, LEVEL_LABEL, type EnrichedAlert } from '@/types/alert'

const props = defineProps<{
  alert: EnrichedAlert
  shipNameOf?: (id?: number) => string
}>()

const emit = defineEmits<{
  (e: 'select', alert: EnrichedAlert): void
}>()

const levelColor = computed(() => LEVEL_COLOR[props.alert.levelKey] ?? LEVEL_COLOR.info)
const levelLabel = computed(() => LEVEL_LABEL[props.alert.levelKey] ?? '提示')

function fmtNum(v?: number | string | null) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toFixed(2)
}

function relTime(iso?: string): string {
  if (!iso) return '--'
  const t = new Date(iso.replace(' ', 'T')).getTime()
  if (Number.isNaN(t)) return iso
  const diff = Date.now() - t
  if (diff < 0) return '刚刚'
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  return d <= 30 ? `${d} 天前` : new Date(t).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.alert-card {
  position: relative;
  padding: 14px 16px;
  border-left: 3px solid var(--nx-primary);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(2, 8, 20, 0.55);
}
.ac-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ac-level {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 1px;
}
.ac-ship {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--nx-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ac-rule {
  font-size: 12.5px;
  color: var(--nx-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ac-foot {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: #7d93b8;
}
.ac-value b {
  color: var(--nx-amber);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
</style>
