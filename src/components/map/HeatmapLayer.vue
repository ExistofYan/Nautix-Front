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
    />
  </g>
</template>

<script setup lang="ts">
/** 热力点图层：按网格聚合点位密度。
 *
 * 性能要点：
 * - 整层只做一次 CSS blur（group 级），不再给每个圆斑挂独立 SVG
 *   feGaussianBlur 滤镜 —— 逐个滤镜会让浏览器反复建离屏合成层，
 *   是点击「热力点」开关后页面冻结的主因之一。
 * - 圆斑数量上限 CAP，聚合格点在视野放大后可能爆炸式增长。
 */
import { computed } from 'vue'
import type { MapBounds } from '@/types/map'
import type { LonLat } from '@/types/map'
import { makeProjector, VIEW_W, VIEW_H } from '@/hooks/useMap'

const props = defineProps<{ bounds: MapBounds; points: LonLat[] }>()

const CELL = 50 // viewBox 格子像素
const CAP = 160 // 圆斑上限

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
  const visible = out.filter((b) => b.x >= -CELL && b.x <= VIEW_W + CELL && b.y >= -CELL && b.y <= VIEW_H + CELL)
  // 超过上限时只保留密度最高的 CAP 个（按聚合计数排序）
  if (visible.length <= CAP) return visible
  const sorted = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, CAP)
  return sorted.map((c) => {
    const cx = c.x / c.n
    const cy = c.y / c.n
    const t = c.n / max
    const color = t > 0.7 ? '#fb7185' : t > 0.4 ? '#fbbf24' : '#38bdf8'
    return { x: cx, y: cy, r: 14 + t * 30, color, alpha: 0.25 + t * 0.5 }
  })
})
</script>

<style scoped>
.heatmap-layer {
  mix-blend-mode: screen;
  /* 整层一次模糊代替逐元素滤镜；filter 区域覆盖整个 viewBox */
  filter: blur(6px);
}
</style>
