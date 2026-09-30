<template>
  <g class="heatmap-layer">
    <circle
      v-for="(h, i) in blobs"
      :key="'hm' + i"
      :cx="h.x"
      :cy="h.y"
      :r="h.r"
      :fill="h.color"
      :fill-opacity="h.alpha"
      filter="url(#hm-blur)"
    />
    <defs>
      <filter id="hm-blur" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  </g>
</template>

<script setup lang="ts">
/** 热力点图层：按网格聚合点位密度，高斯模糊圆斑表达热度 */
import { computed } from 'vue'
import type { MapBounds } from '@/types/map'
import type { LonLat } from '@/types/map'
import { makeProjector, VIEW_W, VIEW_H } from '@/hooks/useMap'

const props = defineProps<{ bounds: MapBounds; points: LonLat[] }>()

const CELL = 50 // viewBox 格子像素

const blobs = computed(() => {
  const p = makeProjector(props.bounds)
  const counts = new Map<string, { x: number; y: number; n: number }>()
  for (const pt of props.points) {
    if (!Number.isFinite(pt.longitude) || !Number.isFinite(pt.latitude)) continue
    const q = p(pt)
    const key = `${Math.floor(q.x / CELL)}:${Math.floor(q.y / CELL)}`
    const cur = counts.get(key)
    if (cur) {
      cur.n += 1
      cur.x += q.x
      cur.y += q.y
    } else {
      counts.set(key, { x: q.x, y: q.y, n: 1 })
    }
  }
  let max = 1
  for (const c of counts.values()) max = Math.max(max, c.n)
  const out: { x: number; y: number; r: number; color: string; alpha: number }[] = []
  for (const c of counts.values()) {
    const cx = c.x / c.n
    const cy = c.y / c.n
    const t = c.n / max
    const r = 14 + t * 30
    const color = t > 0.7 ? '#fb7185' : t > 0.4 ? '#fbbf24' : '#38bdf8'
    out.push({ x: cx, y: cy, r, color, alpha: 0.25 + t * 0.5 })
  }
  return out.filter((b) => b.x >= -CELL && b.x <= VIEW_W + CELL && b.y >= -CELL && b.y <= VIEW_H + CELL)
})
</script>

<style scoped>
.heatmap-layer {
  mix-blend-mode: screen;
}
</style>
