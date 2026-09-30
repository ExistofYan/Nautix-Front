<template>
  <div class="insight-card nx-panel">
    <div class="i-head">
      <span class="i-icon" :style="{ background: toneBg }"><el-icon><component :is="iconComp" /></el-icon></span>
      <b>{{ title }}</b>
      <el-tag size="small" effect="plain" round :type="levelTag">{{ level }}</el-tag>
    </div>
    <p class="i-body">{{ body }}</p>
    <div class="conf-row">
      <span class="c-label">置信度</span>
      <el-progress :percentage="confPct" :stroke-width="6" :color="confColor" style="flex: 1" />
      <b class="c-val">{{ confPct }}%</b>
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue'
import type { Component } from 'vue'
import { TrendCharts, Warning, Opportunity, DataAnalysis } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  title: string
  body: string
  kind?: 'trend' | 'risk' | 'tip' | 'stat'
  level?: string
  confidence?: number
}>(), {
  kind: 'trend',
  level: '提示',
  confidence: 0.75,
})

const ICONS: Record<string, Component> = {
  trend: markRaw(TrendCharts),
  risk: markRaw(Warning),
  tip: markRaw(Opportunity),
  stat: markRaw(DataAnalysis),
}
const iconComp = computed(() => ICONS[props.kind] ?? ICONS.trend)

const toneBg = computed(() => ({
  trend: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
  risk: 'linear-gradient(135deg,#f43f5e,#d97706)',
  tip: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
  stat: 'linear-gradient(135deg,#10b981,#06b6d4)',
}[props.kind]))

const levelTag = computed((): 'danger' | 'warning' | 'info' => {
  const k = props.level
  if (k.includes('高') || k.toLowerCase().includes('high')) return 'danger'
  if (k.includes('中') || k.toLowerCase().includes('mid')) return 'warning'
  return 'info'
})

const confPct = computed(() => Math.max(0, Math.min(100, Math.round(props.confidence * 100))))
const confColor = computed(() => (confPct.value >= 80 ? '#34d399' : confPct.value >= 55 ? '#fbbf24' : '#fb7185'))
</script>

<style scoped>
.insight-card { padding: 14px 16px; border-radius: 13px; }
.i-head { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
.i-head b { color: var(--nx-text); font-size: 14px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.i-icon { width: 28px; height: 28px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; color: #fff; flex: none; }
.i-body { margin: 0 0 10px; font-size: 12.5px; line-height: 1.7; color: var(--nx-text-dim); }
.conf-row { display: flex; align-items: center; gap: 10px; }
.c-label { font-size: 11px; color: #64748b; flex: none; }
.c-val { font-size: 11.5px; color: var(--nx-text); font-family: Consolas, monospace; flex: none; }
</style>
