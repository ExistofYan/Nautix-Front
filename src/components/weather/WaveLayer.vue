<template>
  <g class="wave-layer">
    <!-- 背景色带：按全区域最大浪高映射 -->
    <rect v-for="(band, i) in bands" :key="'wb' + i" x="0" :y="band.y" :width="VIEW_W" :height="band.h" :fill="band.color" fill-opacity="0.16" />
    <!-- 格点浪高圆斑 -->
    <g v-for="(c, i) in cells" :key="'wc' + i">
      <circle :cx="c.x" :cy="c.y" :r="c.r" :fill="c.color" fill-opacity="0.45" />
      <path
        :d="`M ${c.x - c.r} ${c.y} q ${c.r / 3} ${-c.r / 2.4} ${c.r / 1.5} 0 t ${c.r / 1.5} 0`"
        fill="none" stroke="#e0f2fe" stroke-opacity="0.7" stroke-width="1.2"
      />
      <text :x="c.x" :y="c.y + c.r + 11" text-anchor="middle" font-size="8" fill="#a8bdd9">{{ c.h.toFixed(1) }}m</text>
    </g>
    <text v-if="cells.length === 0" :x="VIEW_W / 2" :y="VIEW_H / 2" text-anchor="middle" font-size="12" fill="#64748b">暂无浪高数据</text>
  </g>
</template>

<script setup lang="ts">
/**
 * 浪高图层：色阶圆斑（蓝→青→紫）+ 波峰线装饰。
 * 圆斑带 mix-blend-mode: screen（GPU 合成开销大），必须抽样限流，
 * 全量区域铺开时开关切换会明显掉帧。
 */
import { computed } from 'vue'
import type { WeatherRegion } from '@/api/types'
import { VIEW_W, VIEW_H } from '@/types/map'

const props = defineProps<{ regions: WeatherRegion[] }>()

/** 圆斑格点抽样上限 */
const GRID_CAP = 36

function waveColor(h: number): string {
  if (h >= 5) return '#a78bfa'
  if (h >= 3) return '#7c3aed'
  if (h >= 1.5) return '#22d3ee'
  return '#38bdf8'
}

const maxH = computed(() => Math.max(1, ...props.regions.map((r) => r.waveHeight ?? 0)))

/** 等距抽样 */
const sampled = computed(() => {
  const n = props.regions.length
  if (n <= GRID_CAP) return props.regions
  const step = n / GRID_CAP
  const out: WeatherRegion[] = []
  for (let i = 0; i < GRID_CAP; i++) out.push(props.regions[Math.floor(i * step)])
  return out
})

const bands = computed(() => {
  const levels = [0.5, 1.5, 3, 5]
  return levels.map((lv, i) => ({
    y: VIEW_H - ((i + 1) * VIEW_H) / (levels.length + 1),
    h: VIEW_H / (levels.length + 1),
    color: waveColor(lv),
  }))
})

const cells = computed(() => {
  const list = sampled.value
  const n = list.length
  if (!n) return []
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  return list.map((r, i) => {
    const h = r.waveHeight ?? 0
    return {
      x: ((i % cols) + 0.5) * (VIEW_W / cols),
      y: (Math.floor(i / cols) + 0.5) * (VIEW_H / rows),
      h,
      r: 8 + (h / maxH.value) * 26,
      color: waveColor(h),
    }
  })
})
</script>

<style scoped>
.wave-layer circle {
  mix-blend-mode: screen;
}
</style>
