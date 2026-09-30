<template>
  <div class="ship-status nx-panel">
    <div class="ss-head">
      <span class="ss-title">{{ title }}</span>
      <el-tag size="small" :type="statusTagType" effect="dark" round>{{ statusText }}</el-tag>
    </div>

    <div v-if="!runtime" class="ss-empty">暂无实时数据</div>

    <div v-else class="ss-rows">
      <div class="ss-row">
        <div class="ss-label"><el-icon><Position /></el-icon>航速</div>
        <el-progress :percentage="Math.min(100, ((runtime.speed ?? 0) / 25) * 100)" :stroke-width="8" :show-text="false" color="#38bdf8" />
        <b class="ss-val">{{ fmt(runtime.speed) }} kn</b>
      </div>
      <div class="ss-row">
        <div class="ss-label"><el-icon><Odometer /></el-icon>主机负荷</div>
        <el-progress :percentage="Math.min(100, runtime.engineLoad ?? 0)" :stroke-width="8" :show-text="false" :color="loadColor" />
        <b class="ss-val">{{ fmt(runtime.engineLoad, 0) }}%</b>
      </div>
      <div class="ss-row">
        <div class="ss-label"><el-icon><Coin /></el-icon>燃油余量</div>
        <el-progress :percentage="Math.min(100, runtime.fuelPercent ?? 0)" :stroke-width="8" :show-text="false" :color="fuelColor" />
        <b class="ss-val">{{ fmt(runtime.fuelPercent, 0) }}%</b>
      </div>
      <div class="ss-meta">
        <span><el-icon><Compass /></el-icon> 航向 {{ fmt(runtime.heading, 0) }}°</span>
        <span>更新于 {{ (runtime.lastUpdate || '--').replace('T', ' ').slice(5, 16) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 船舶状态徽章组：sailingStatus 标签 + 航速/负荷/油量三色进度 */
import { computed } from 'vue'
import type { ShipRuntimeStatus } from '@/api/types'

const props = withDefaults(defineProps<{
  runtime?: ShipRuntimeStatus | null
  title?: string
}>(), {
  runtime: null,
  title: '实时状态',
})

const fmt = (n?: number | null, d = 1) => (n == null || Number.isNaN(n) ? '--' : n.toFixed(d))

const statusText = computed(() => {
  const s = (props.runtime?.sailingStatus ?? '').toUpperCase()
  if (!s) return '未知'
  if (/SEA|NAVIG|航行/.test(s)) return '在航'
  if (/ANCHOR|锚/.test(s)) return '锚泊'
  if (/BERTH|MOORED|靠泊|系泊/.test(s)) return '靠泊'
  return props.runtime?.sailingStatus ?? '未知'
})

const statusTagType = computed<'success' | 'warning' | 'info'>(() => {
  if (statusText.value === '在航') return 'success'
  if (statusText.value === '锚泊') return 'warning'
  return 'info'
})

const loadColor = computed(() => {
  const v = props.runtime?.engineLoad ?? 0
  return v > 85 ? '#fb7185' : v > 60 ? '#fbbf24' : '#34d399'
})

const fuelColor = computed(() => {
  const v = props.runtime?.fuelPercent ?? 100
  return v < 15 ? '#fb7185' : v < 35 ? '#fbbf24' : '#22d3ee'
})
</script>

<style scoped>
.ship-status { padding: 14px 16px; border-radius: 14px; }
.ss-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ss-title { font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.5px; }
.ss-empty { font-size: 12px; color: #64748b; padding: 10px 0; }
.ss-row { display: grid; grid-template-columns: 86px 1fr 52px; align-items: center; gap: 10px; margin-bottom: 9px; }
.ss-label { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #94a3b8; }
.ss-val { font-size: 12px; color: #e0f2fe; text-align: right; font-variant-numeric: tabular-nums; }
.ss-meta { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(148, 184, 232, 0.15); font-size: 10.5px; color: #64748b; }
.ss-meta span { display: inline-flex; align-items: center; gap: 4px; }
</style>
