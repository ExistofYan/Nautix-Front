<template>
  <div class="kpi-card nx-panel">
    <div class="kpi-icon" :style="{ background: iconBg }">
      <el-icon :size="20"><component :is="iconComponent" /></el-icon>
    </div>
    <div class="kpi-body">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value-row">
        <span class="kpi-value">{{ display }}</span>
        <span v-if="unit" class="kpi-unit">{{ unit }}</span>
        <span v-if="trend !== 'flat'" class="kpi-trend" :class="'trend-' + trend">
          <el-icon :size="14"><component :is="trendIcon" /></el-icon>
        </span>
      </div>
      <div v-if="description" class="kpi-desc">{{ description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Component } from 'vue'
import { ArrowUp, ArrowDown, Minus, DataLine } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: number | string | null | undefined
    unit?: string
    precision?: number
    trend?: 'up' | 'down' | 'flat'
    icon?: Component | string
    description?: string
    /** count-up 动画时长（毫秒），传 0 关闭 */
    duration?: number
  }>(),
  { precision: 1, trend: 'flat', duration: 600 },
)

const trendIcon = computed(() => (props.trend === 'up' ? ArrowUp : props.trend === 'down' ? ArrowDown : Minus))

const iconComponent = computed<Component>(() => {
  if (props.icon && typeof props.icon !== 'string') return props.icon
  return DataLine
})
const iconBg = computed(() => 'linear-gradient(135deg, rgba(56,189,248,.25), rgba(124,58,237,.25))')

function toNum(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}

const display = ref<string>('—')

function fmtStatic(v: number | string | null | undefined): string {
  const n = toNum(v)
  if (n == null) return String(v ?? '—') || '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(props.precision)
}

// count-up：数值型 value 变化时从旧值滚到新值
watch(
  () => props.value,
  (val) => {
    const target = toNum(val)
    if (target == null || props.duration <= 0) {
      display.value = fmtStatic(val)
      return
    }
    const from = toNum(display.value.replace(/[^\d.-]/g, '')) ?? 0
    const start = performance.now()
    const dur = props.duration
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      const cur = from + (target - from) * eased
      display.value = Number.isInteger(target) ? String(Math.round(cur)) : cur.toFixed(props.precision)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  },
  { immediate: true },
)
</script>

<style scoped>
.kpi-card {
  display: flex; align-items: center; gap: 14px; padding: 16px 18px;
  transition: transform .2s ease;
}
.kpi-card:hover { transform: translateY(-3px); }
.kpi-icon {
  width: 44px; height: 44px; border-radius: 12px; flex: none;
  display: flex; align-items: center; justify-content: center; color: #7dd3fc;
  border: 1px solid rgba(125, 211, 252, .25);
}
.kpi-body { min-width: 0; }
.kpi-label { font-size: 12px; color: var(--nx-text-dim); }
.kpi-value-row { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
.kpi-value {
  font-size: 26px; font-weight: 800; color: #e0f2fe;
  font-variant-numeric: tabular-nums; line-height: 1.1;
}
.kpi-unit { font-size: 12px; color: var(--nx-text-dim); }
.kpi-trend { display: inline-flex; align-self: center; }
.trend-up { color: #34d399; }
.trend-down { color: #fb7185; }
.kpi-desc { font-size: 11px; color: #64748b; margin-top: 2px; }
</style>
