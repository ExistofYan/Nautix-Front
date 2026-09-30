<template>
  <div class="nx-panel conn-card">
    <div class="head">
      <span class="title"><el-icon><Connection /></el-icon> 港口航线连通图</span>
      <span class="meta">{{ nodes.length }} 港 · {{ edges.length }} 条有向连接</span>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />
    <template v-else-if="nodes.length && edges.length">
      <svg viewBox="0 0 720 460" class="chord-svg" preserveAspectRatio="xMidYMid meet">
        <!-- connection arcs -->
        <path
          v-for="(e, i) in edgePaths"
          :key="'arc' + i"
          :d="e.d"
          fill="none"
          :stroke="e.color"
          :stroke-width="e.w"
          stroke-linecap="round"
          opacity="0.55"
        >
          <animate attributeName="opacity" values="0.25;0.65;0.25" dur="3s" repeatCount="indefinite" />
        </path>
        <!-- port nodes on circle -->
        <g v-for="n in nodes" :key="n.id">
          <circle :cx="n.x" :cy="n.y" r="5" fill="#7dd3fc" stroke="#0b1a30" stroke-width="1.5" />
          <text
            :x="n.labelX" :y="n.labelY"
            :text-anchor="n.anchor"
            class="node-label"
          >{{ n.name }}</text>
        </g>
      </svg>
      <div class="legend">连线越粗 = 两港间航线越多；悬停节点查看港名</div>
    </template>
    <el-empty v-else description="暂无可连通的港口（需 /port/all 与 /route/page 均有数据）" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortStore } from '@/stores/port'
import { getRoutePage } from '@/api/route'
import type { Route } from '@/api/types'
import type { PortConnectionEdge } from '@/types/port'

const store = usePortStore()
const routes = ref<Route[]>([])
const loading = ref(true)

const CX = 360, CY = 230, R = 170

/** ports that actually participate in at least one route */
const usedPortIds = computed(() => {
  const s = new Set<number>()
  for (const r of routes.value) {
    if (r.startPortId != null) s.add(r.startPortId)
    if (r.endPortId != null) s.add(r.endPortId)
  }
  return s
})

const nodes = computed(() => {
  const list = store.ports.filter(p => p.id != null && usedPortIds.value.has(p.id)).slice(0, 28)
  const n = Math.max(list.length, 1)
  return list.map((p, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2
    const x = CX + R * Math.cos(ang)
    const y = CY + R * Math.sin(ang)
    const lx = CX + (R + 14) * Math.cos(ang)
    const ly = CY + (R + 14) * Math.sin(ang)
    return {
      id: p.id as number,
      name: p.portName || `#${p.id}`,
      x, y,
      labelX: lx,
      labelY: ly + 3,
      anchor: Math.cos(ang) > 0.2 ? 'start' as const : Math.cos(ang) < -0.2 ? 'end' as const : 'middle' as const,
    }
  })
})

const nodePos = computed(() => {
  const m = new Map<number, { x: number; y: number }>()
  for (const nd of nodes.value) m.set(nd.id, { x: nd.x, y: nd.y })
  return m
})

const edges = computed<PortConnectionEdge[]>(() => {
  const agg = new Map<string, PortConnectionEdge>()
  for (const r of routes.value) {
    if (r.startPortId == null || r.endPortId == null) continue
    if (!nodePos.value.has(r.startPortId) || !nodePos.value.has(r.endPortId)) continue
    const key = `${r.startPortId}->${r.endPortId}`
    const e = agg.get(key) ?? { startPortId: r.startPortId, endPortId: r.endPortId, routeCount: 0, totalDistanceNm: 0 }
    e.routeCount++
    e.totalDistanceNm += r.distanceNm ?? 0
    agg.set(key, e)
  }
  return [...agg.values()]
})

const PALETTE = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee']
const edgePaths = computed(() => {
  const maxCnt = Math.max(...edges.value.map(e => e.routeCount), 1)
  return edges.value.map((e, i) => {
    const a = nodePos.value.get(e.startPortId)!
    const b = nodePos.value.get(e.endPortId)!
    // quadratic curve pulled toward center for the classic chord look
    const mx = (a.x + b.x) / 2 + (CX - (a.x + b.x) / 2) * 0.55
    const my = (a.y + b.y) / 2 + (CY - (a.y + b.y) / 2) * 0.55
    return {
      d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`,
      w: 1 + (e.routeCount / maxCnt) * 4,
      color: PALETTE[i % PALETTE.length],
    }
  })
})

onMounted(async () => {
  await store.load()
  try {
    const res = await getRoutePage({ page: 1, count: 100 })
    routes.value = res.records ?? []
  } catch { /* empty state */ } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.conn-card { padding: 18px 20px; border-radius: 14px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.title { display: inline-flex; align-items: center; gap: 8px; color: var(--nx-text); font-weight: 700; font-size: 15px; }
.meta { font-size: 11.5px; color: #64748b; }
.chord-svg { width: 100%; height: auto; max-height: 460px; }
.node-label { fill: #cbd5e1; font-size: 10px; paint-order: stroke; stroke: rgba(6, 13, 31, 0.85); stroke-width: 2.5px; }
.legend { text-align: center; font-size: 11px; color: #64748b; margin-top: 4px; }
</style>
