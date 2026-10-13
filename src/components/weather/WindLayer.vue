<template>
  <g class="wind-layer">
    <g v-for="(c, i) in cells" :key="'wd' + i" :transform="`translate(${c.x.toFixed(1)},${c.y.toFixed(1)}) rotate(${c.dir})`">
      <!-- 风杆 -->
      <line x1="0" y1="0" x2="0" :y2="-c.len" :stroke="color(c.speed)" stroke-width="1.8" stroke-linecap="round" />
      <!-- 羽尾：每 5 m/s 一道 -->
      <line
        v-for="k in barbs(c.speed)"
        :key="'b' + k"
        :x1="0" :y1="-c.len + (k - 1) * 4"
        :x2="6" :y2="-c.len + (k - 1) * 4 - 3"
        :stroke="color(c.speed)"
        stroke-width="1.4"
      />
      <circle r="1.8" fill="#e2e8f0" fill-opacity="0.75" />
    </g>
    <text v-if="cells.length === 0" :x="VIEW_W / 2" :y="VIEW_H / 2" text-anchor="middle" font-size="12" fill="#64748b">
      暂无风场数据
    </text>
  </g>
</template>

<script setup lang="ts">
/**
 * 风矢量场图层：格点散布，方向=windDirection，长度/颜色∝windSpeed。
 * 抽样上限 GRID_CAP：全量 1000 区域会让本层与相邻天气层同时铺开数千节点，
 * 抽样后仍保持均匀格点观感，切换开关不再卡顿。
 */
import { computed } from 'vue'
import type { WeatherRegion } from '@/api/types'
import { VIEW_W, VIEW_H } from '@/types/map'

const props = defineProps<{ regions: WeatherRegion[] }>()

/** 格点抽样上限 */
const GRID_CAP = 48

function color(v: number): string {
  if (v >= 20) return '#fb7185'
  if (v >= 14) return '#fbbf24'
  if (v >= 8) return '#22d3ee'
  if (v >= 3) return '#38bdf8'
  return '#64748b'
}

function barbs(v: number): number {
  return Math.max(0, Math.min(5, Math.floor(v / 5)))
}

/** 等距抽样，保留原顺序，保证格点分布均匀 */
const sampled = computed(() => {
  const n = props.regions.length
  if (n <= GRID_CAP) return props.regions
  const step = n / GRID_CAP
  const out: WeatherRegion[] = []
  for (let i = 0; i < GRID_CAP; i++) out.push(props.regions[Math.floor(i * step)])
  return out
})

const cells = computed(() => {
  const n = sampled.value.length
  if (!n) return []
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  return sampled.value.map((r, i) => ({
    x: ((i % cols) + 0.5) * (VIEW_W / cols),
    y: (Math.floor(i / cols) + 0.5) * (VIEW_H / rows),
    dir: r.windDirection ?? 0,
    speed: r.windSpeed ?? 0,
    len: 10 + Math.min(26, (r.windSpeed ?? 0) * 1.1),
  }))
})
</script>

<style scoped>
.wind-layer line {
  stroke-linecap: round;
}
</style>
