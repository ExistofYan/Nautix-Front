<template>
  <g class="route-polyline">
    <!-- 底色完整路径 -->
    <path :d="pathD" fill="none" :stroke="dimColor" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" />
    <!-- 高亮已走过段（highlightRatio>0 时） -->
    <path v-if="highlightRatio > 0" :d="pathD" fill="none" :stroke="color" :stroke-width="strokeWidth + 0.6" stroke-linecap="round" stroke-linejoin="round" :stroke-dasharray="dashArray" />
    <!-- 起终点标记 -->
    <circle v-if="firstPt" :cx="firstPt.x" :cy="firstPt.y" r="4" :fill="color" stroke="#0a1428" stroke-width="1.5" />
    <rect v-if="lastPt" :x="lastPt.x - 3.5" :y="lastPt.y - 3.5" width="7" height="7" :fill="'#fbbf24'" stroke="#0a1428" stroke-width="1.5" transform-origin="center" :transform="`rotate(45 ${lastPt.x} ${lastPt.y})`" />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoutePoint } from '@/api/types'

const props = withDefaults(
  defineProps<{
    points: RoutePoint[]
    /** 投影：把经纬度映射到 viewBox 坐标 */
    project: (lat: number, lon: number) => { x: number; y: number }
    color?: string
    dimColor?: string
    strokeWidth?: number
    /** 0~1，走过的比例段用亮色 dash 覆盖 */
    highlightRatio?: number
  }>(),
  {
    color: '#38bdf8',
    dimColor: 'rgba(56,189,248,0.28)',
    strokeWidth: 2,
    highlightRatio: 0,
  }
)

const pts = computed(() =>
  props.points
    .filter(p => p.latitude != null && p.longitude != null)
    .map(p => props.project(p.latitude as number, p.longitude as number))
)

const pathD = computed(() =>
  pts.value.length ? pts.value.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ') : ''
)

/** 按弧长近似计算 dash：以点序占比代替真实弧长（视觉足够） */
const dashArray = computed(() => {
  const n = Math.max(1, pts.value.length - 1)
  const segs = Math.max(1, Math.round(n * Math.min(1, Math.max(0, props.highlightRatio))))
  return `${segs} ${n - segs}`
})

const firstPt = computed(() => pts.value[0])
const lastPt = computed(() => pts.value[pts.value.length - 1])
</script>

<style scoped>
.route-polyline {
  pointer-events: none;
}
</style>
