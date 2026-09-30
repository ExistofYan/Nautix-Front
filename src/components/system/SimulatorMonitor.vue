<template>
  <div class="nx-panel sim-card">
    <div class="head">
      <span class="title"><el-icon><Cpu /></el-icon> 模拟器产出监控</span>
      <el-tag size="small" effect="plain" :type="fresh ? 'success' : 'warning'">
        {{ fresh ? '数据流正常' : '数据流延迟/中断' }}
      </el-tag>
    </div>

    <div class="grid">
      <div class="cell">
        <div class="c-value">{{ latestText }}</div>
        <div class="c-label">最新传感器记录时间</div>
      </div>
      <div class="cell">
        <div class="c-value">{{ throughput.rowsPerMinute }}</div>
        <div class="c-label">估算写入速率（条/分钟）</div>
      </div>
      <div class="cell">
        <div class="c-value">{{ throughput.shipsReporting }}</div>
        <div class="c-label">在报船舶数（/runtime）</div>
      </div>
    </div>

    <div class="status-dist">
      <span v-for="s in throughput.statusDist" :key="s.status" class="chip">
        <i :class="'dot-' + statusTone(s.status)" />{{ s.status || '未知' }} × {{ s.count }}
      </span>
      <span v-if="!throughput.statusDist.length" class="chip muted">暂无航行状态数据</span>
    </div>

    <div class="foot">速率口径：trend 采样窗口内相邻记录的时间跨度反推，仅供参考</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getSensorTrendData } from '@/api/sensor'
import { useRuntimeStore } from '@/stores/runtime'
import type { SimThroughput } from '@/types/runtime'
import type { SensorData } from '@/api/types'

const rt = useRuntimeStore()
const trend = ref<SensorData[]>([])

const latest = computed<number | null>(() => {
  let max: number | null = null
  for (const d of trend.value) {
    if (!d.recordedAt) continue
    const t = new Date(d.recordedAt).getTime()
    if (Number.isFinite(t) && (max == null || t > max)) max = t
  }
  return max
})

const latestText = computed(() =>
  latest.value == null ? '--' : new Date(latest.value).toLocaleTimeString('zh-CN', { hour12: false }),
)

const fresh = computed(() => latest.value != null && Date.now() - latest.value < 5 * 60 * 1000)

const throughput = computed<SimThroughput>(() => {
  const times = trend.value
    .map(d => (d.recordedAt ? new Date(d.recordedAt).getTime() : NaN))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  let rpm = 0
  if (times.length >= 2) {
    const spanMin = Math.max((times[times.length - 1] - times[0]) / 60000, 0.001)
    rpm = Math.round(times.length / spanMin)
  }
  const dist = new Map<string, number>()
  for (const r of rt.rows) {
    const k = r.sailingStatus || '未知'
    dist.set(k, (dist.get(k) ?? 0) + 1)
  }
  return {
    rowsPerMinute: rpm,
    latestStamp: latest.value,
    shipsReporting: rt.rows.length,
    statusDist: [...dist.entries()].map(([status, count]) => ({ status, count })),
  }
})

function statusTone(s?: string): 'ok' | 'warn' | 'bad' | 'idle' {
  const k = (s || '').toUpperCase()
  if (k.includes('SEA') || k.includes('NAVIGAT') || k.includes('RUN')) return 'ok'
  if (k.includes('PORT') || k.includes('DOCK') || k.includes('MOOR')) return 'idle'
  if (k.includes('ALERT') || k.includes('EMER')) return 'bad'
  return 'warn'
}

onMounted(async () => {
  try {
    trend.value = (await getSensorTrendData(300)) ?? []
  } catch { /* empty state */ }
})
</script>

<style scoped>
.sim-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.cell { background: rgba(9, 17, 35, 0.55); border: 1px solid var(--nx-panel-border); border-radius: 10px; padding: 14px; text-align: center; }
.c-value { font-size: 22px; font-weight: 800; color: #7dd3fc; font-family: 'JetBrains Mono', Consolas, monospace; }
.c-label { margin-top: 4px; font-size: 11.5px; color: var(--nx-text-dim); }
.status-dist { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--nx-text-dim); background: rgba(13, 31, 49, 0.7); border: 1px solid var(--nx-panel-border); padding: 4px 10px; border-radius: 999px; }
.chip.muted { opacity: 0.6; }
.dot-ok, .dot-warn, .dot-bad, .dot-idle { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.dot-ok { background: #34d399; box-shadow: 0 0 6px rgba(52, 211, 153, 0.8); }
.dot-warn { background: #fbbf24; }
.dot-bad { background: #fb7185; box-shadow: 0 0 6px rgba(251, 113, 133, 0.8); }
.dot-idle { background: #64748b; }
.foot { margin-top: 12px; font-size: 11px; color: #64748b; }
</style>
