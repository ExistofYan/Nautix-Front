<template>
  <div class="nx-panel queue-card">
    <div class="head">
      <span class="title"><el-icon><Sort /></el-icon> 数据队列延迟（代理指标）</span>
      <el-tag size="small" effect="plain" type="info">口径：按各船 lastUpdate 新鲜度分桶</el-tag>
    </div>

    <div v-if="total === 0" class="empty-mini">暂无实时上报数据</div>
    <div v-else class="bars">
      <div v-for="b in buckets" :key="b.label" class="bar-row">
        <span class="b-label">{{ b.label }}</span>
        <div class="b-track">
          <i :style="{ width: pct(b.count) + '%', background: toneColor(b.tone) }" />
        </div>
        <span class="b-count">{{ b.count }} 艘</span>
      </div>
    </div>

    <div class="foot">总上报船舶 {{ total }} 艘 · 数据源 /runtime · 每 5s 刷新</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuntimeStore } from '@/stores/runtime'
import type { FreshnessBucket } from '@/types/runtime'

const rt = useRuntimeStore()

const TONES: Record<FreshnessBucket['tone'], string> = {
  green: 'linear-gradient(90deg,#34d399,#10b981)',
  cyan: 'linear-gradient(90deg,#38bdf8,#2563eb)',
  amber: 'linear-gradient(90deg,#fbbf24,#f59e0b)',
  red: 'linear-gradient(90deg,#fb7185,#ef4444)',
}
function toneColor(t: FreshnessBucket['tone']) { return TONES[t] }

const buckets = computed<FreshnessBucket[]>(() => {
  const now = Date.now()
  let lt10 = 0, s10_60 = 0, m1_5 = 0, gt5 = 0
  for (const r of rt.rows) {
    if (!r.lastUpdate) { gt5++; continue }
    const age = (now - new Date(r.lastUpdate).getTime()) / 1000
    if (!Number.isFinite(age)) { gt5++; continue }
    if (age <= 10) lt10++
    else if (age <= 60) s10_60++
    else if (age <= 300) m1_5++
    else gt5++
  }
  return [
    { label: '< 10 秒', count: lt10, tone: 'green' },
    { label: '10–60 秒', count: s10_60, tone: 'cyan' },
    { label: '1–5 分钟', count: m1_5, tone: 'amber' },
    { label: '> 5 分钟 / 缺失', count: gt5, tone: 'red' },
  ]
})

const total = computed(() => rt.rows.length)
function pct(n: number) {
  return total.value ? Math.max(2, Math.round((n / total.value) * 100)) : 0
}
</script>

<style scoped>
.queue-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px; flex-wrap: wrap; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.bars { display: flex; flex-direction: column; gap: 12px; }
.bar-row { display: grid; grid-template-columns: 110px 1fr 60px; align-items: center; gap: 10px; }
.b-label { font-size: 12.5px; color: var(--nx-text-dim); }
.b-track { height: 10px; border-radius: 5px; background: rgba(148, 184, 232, 0.10); overflow: hidden; }
.b-track i { display: block; height: 100%; border-radius: 5px; transition: width 0.5s ease; }
.b-count { font-size: 12.5px; color: var(--nx-text); text-align: right; font-family: Consolas, monospace; }
.empty-mini { padding: 24px 0; text-align: center; font-size: 12.5px; color: #64748b; }
.foot { margin-top: 14px; font-size: 11px; color: #64748b; }
</style>
