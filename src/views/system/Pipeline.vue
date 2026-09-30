<template>
  <div class="nx-page pipeline-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title"><el-icon><Share /></el-icon> 数据流水线</h2>
        <p class="nx-page-desc">模拟器 → 队列 → 批量写入 → 数据库 · 节点计数取自真实只读端点</p>
      </div>
      <el-button round @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <div class="nx-panel flow-card">
      <svg :viewBox="`0 0 ${W} ${H}`" class="flow-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pipeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#a78bfa" />
          </linearGradient>
        </defs>
        <g v-for="(n, i) in nodes" :key="n.id">
          <path
            v-if="i < nodes.length - 1"
            :d="linkPath(i)"
            stroke="url(#pipeGrad)"
            stroke-width="2"
            fill="none"
            opacity="0.5"
          />
          <rect
            :x="nodeX(i)" :y="60" :width="NODE_W" :height="96" rx="14"
            fill="rgba(13,26,51,0.85)"
            :stroke="toneStroke(n.tone)"
            stroke-width="1.2"
          />
          <text :x="nodeX(i) + NODE_W / 2" :y="92" text-anchor="middle" class="t-label">{{ n.label }}</text>
          <text :x="nodeX(i) + NODE_W / 2" :y="122" text-anchor="middle" class="t-value" :fill="toneColor(n.tone)">
            {{ n.value.toLocaleString() }}
          </text>
          <text :x="nodeX(i) + NODE_W / 2" :y="142" text-anchor="middle" class="t-sub">{{ n.unit }} · {{ n.sub }}</text>
        </g>
        <!-- flowing dots -->
        <circle v-for="i in 3" :key="'dot' + i" r="3.5" fill="#7dd3fc">
          <animateMotion
            dur="2.6s"
            :begin="`${(i - 1) * 0.9}s`"
            repeatCount="indefinite"
            :path="fullLinkPath()"
          />
        </circle>
      </svg>
    </div>

    <QueueMonitor />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QueueMonitor from '@/components/system/QueueMonitor.vue'
import { useRuntimeStore } from '@/stores/runtime'
import { getSensorDataPage } from '@/api/sensor'
import { getDashboardStats } from '@/api/dashboard'
import type { PipelineNode } from '@/types/runtime'

const rt = useRuntimeStore()
const sensorTotal = ref(0)
const shipCount = ref(0)

const W = 960
const H = 220
const NODE_W = 190
const GAP = () => (W - NODE_W * 4) / 3
function nodeX(i: number) { return i * (NODE_W + GAP()) + 10 }
function linkPath(i: number) {
  const x1 = nodeX(i) + NODE_W
  const x2 = nodeX(i + 1)
  const y = 108
  return `M ${x1} ${y} L ${x2} ${y}`
}
function fullLinkPath() {
  return `M ${nodeX(0) + NODE_W} 108 L ${nodeX(3)} 108`
}

const nodes = computed<PipelineNode[]>(() => [
  { id: 'sim', label: '传感器模拟器', sub: '持续产数', value: rt.rows.length, unit: '艘在报', tone: 'cyan' },
  { id: 'queue', label: '实时队列', sub: '/runtime 新鲜度', value: rt.freshWithin(60).length, unit: '艘·分钟内', tone: 'violet' },
  { id: 'write', label: '批量写入', sub: 'sensor_data', value: sensorTotal.value, unit: '行入库', tone: 'green' },
  { id: 'db', label: '业务库总量', sub: '船舶档案', value: shipCount.value, unit: '艘', tone: 'amber' },
])

const TONE_COLOR: Record<PipelineNode['tone'], string> = {
  cyan: '#38bdf8', violet: '#a78bfa', green: '#34d399', amber: '#fbbf24',
}
function toneColor(t: PipelineNode['tone']) { return TONE_COLOR[t] }
function toneStroke(t: PipelineNode['tone']) { return TONE_COLOR[t] + '55' }

async function load() {
  await rt.refresh()
  try {
    const page = await getSensorDataPage({ page: 1, size: 1 })
    sensorTotal.value = page.total ?? 0
  } catch { /* keep */ }
  try {
    const s = await getDashboardStats()
    shipCount.value = s.shipCount ?? 0
  } catch { /* keep */ }
}

onMounted(load)
</script>

<style scoped>
.pipeline-page { display: flex; flex-direction: column; gap: 18px; }
.flow-card { padding: 20px; border-radius: 14px; }
.flow-svg { width: 100%; height: auto; }
.t-label { fill: #e2e8f0; font-size: 14px; font-weight: 700; }
.t-value { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', Consolas, monospace; }
.t-sub { fill: #94a3b8; font-size: 11px; }
</style>
