<template>
  <div class="kpi-wall">
    <div v-for="k in store.kpis" :key="k.key" class="kpi-card nx-panel" :class="'tone-' + (k.tone ?? 'cyan')">
      <div class="kpi-icon"><el-icon :size="26"><component :is="k.icon || 'DataLine'" /></el-icon></div>
      <div class="kpi-main">
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-value">
          <span class="num">{{ shown[k.key] ?? 0 }}</span>
          <em v-if="k.unit" class="unit">{{ k.unit }}</em>
        </div>
      </div>
      <div class="kpi-spark">
        <svg viewBox="0 0 100 28" preserveAspectRatio="none">
          <polyline :points="sparkPoints(k.key)" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useCommandStore } from '@/stores/command'
import type { KpiItem } from '@/types/command'

/** KPI 大数字墙：count-up 动画 + 迷你 sparkline（历史缓冲）。 */
const store = useCommandStore()
const shown = reactive<Record<string, number>>({})
const history = reactive<Record<string, number[]>>({})

watch(
  () => store.kpis,
  (items: KpiItem[]) => {
    for (const it of items) {
      const target = Number.isFinite(it.value) ? it.value : 0
      animateTo(it.key, target, it.precision ?? 0)
      pushHistory(it.key, target)
    }
  },
  { immediate: true, deep: false }
)

function animateTo(key: string, to: number, precision: number) {
  const from = shown[key] ?? 0
  if (from === to) return
  const dur = 700
  const t0 = performance.now()
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    const v = from + (to - from) * eased
    shown[key] = precision > 0 ? round(v, precision) : Math.round(v)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function round(v: number, d: number) {
  const m = Math.pow(10, d)
  return Math.round(v * m) / m
}

const HIST_LEN = 24
function pushHistory(key: string, v: number) {
  const arr = history[key] ?? (history[key] = [])
  arr.push(v)
  if (arr.length > HIST_LEN) arr.shift()
}

const sparkVersion = ref(0)
function sparkPoints(key: string): string {
  void sparkVersion.value // 触发依赖收集
  const arr = history[key] ?? []
  if (arr.length < 2) return ''
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const span = max - min || 1
  return arr.map((v, i) => `${(i / (arr.length - 1)) * 100},${26 - ((v - min) / span) * 24}`).join(' ')
}
// 每次 kpis 变化 bump 版本让 polyline 重算
watch(() => store.kpis, () => { sparkVersion.value++ })
</script>

<style scoped>
.kpi-wall { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.kpi-card {
  position: relative;
  display: flex; align-items: center; gap: 14px;
  padding: 20px 18px 16px;
  border-radius: 16px;
  overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(2, 8, 23, 0.5); }
.kpi-icon { width: 52px; height: 52px; border-radius: 14px; flex: none; display: flex; align-items: center; justify-content: center; background: var(--tone-soft); color: var(--tone); border: 1px solid var(--tone-line); }
.kpi-main { flex: 1; min-width: 0; }
.kpi-label { font-size: 12.5px; color: var(--nx-text-dim); margin-bottom: 6px; letter-spacing: .5px; }
.kpi-value { display: flex; align-items: baseline; gap: 6px; }
.num { font-size: 30px; font-weight: 800; color: #f1f5f9; font-variant-numeric: tabular-nums; line-height: 1; }
.unit { font-style: normal; font-size: 12px; color: #64748b; }
.kpi-spark { position: absolute; right: 0; bottom: 0; left: 0; height: 28px; color: var(--tone); opacity: .35; pointer-events: none; }
.kpi-spark svg { width: 100%; height: 100%; }

.tone-cyan   { --tone:#38bdf8; --tone-soft:rgba(56,189,248,.14); --tone-line:rgba(56,189,248,.3); }
.tone-blue   { --tone:#60a5fa; --tone-soft:rgba(96,165,250,.14); --tone-line:rgba(96,165,250,.3); }
.tone-violet { --tone:#a78bfa; --tone-soft:rgba(167,139,250,.14); --tone-line:rgba(167,139,250,.3); }
.tone-green  { --tone:#34d399; --tone-soft:rgba(52,211,153,.14); --tone-line:rgba(52,211,153,.3); }
.tone-amber  { --tone:#fbbf24; --tone-soft:rgba(251,191,36,.14); --tone-line:rgba(251,191,36,.3); }
.tone-red    { --tone:#fb7185; --tone-soft:rgba(251,113,133,.14); --tone-line:rgba(251,113,133,.3); }
</style>
