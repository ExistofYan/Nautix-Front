<template>
  <g class="temperature-layer">
    <g v-for="(c, i) in cells" :key="'tc' + i">
      <rect :x="c.x - c.s / 2" :y="c.y - c.s / 2" :width="c.s" :height="c.s" rx="8" :fill="c.color" fill-opacity="0.5" />
      <text :x="c.x" :y="c.y - 2" text-anchor="middle" font-size="10" font-weight="700" fill="#0b1220">{{ c.t.toFixed(1) }}°</text>
      <text :x="c.x" :y="c.y + 11" text-anchor="middle" font-size="7.5" fill="#0b1220" fill-opacity="0.75">{{ c.name }}</text>
    </g>
    <text v-if="cells.length === 0" :x="VIEW_W / 2" :y="VIEW_H / 2" text-anchor="middle" font-size="12" fill="#64748b">暂无温度数据</text>
  </g>
</template>

<script setup lang="ts">
/**
 * 温度色块图层：红蓝 diverging scale，海气温双值取均温着色。
 * 每个格点画 1 矩形 + 2 文字，必须抽样限流，
 * 否则天气开关一打开就是数千节点。
 */
import { computed } from 'vue'
import type { WeatherRegion } from '@/api/types'
import { VIEW_W, VIEW_H } from '@/types/map'

const props = defineProps<{ regions: WeatherRegion[] }>()

/** 色块格点抽样上限 */
const GRID_CAP = 30

/** -10..40°C → 蓝(#3b82f6)…白…红(#ef4444) */
function tempColor(t: number): string {
  const x = Math.max(0, Math.min(1, (t + 10) / 50))
  const mix = (a: number, b: number) => Math.round(a + (b - a) * x)
  if (x < 0.5) {
    return `rgb(${mix(59, 226)},${mix(130, 232)},${mix(246, 240)})`
  }
  return `rgb(${mix(226, 239)},${mix(232, 68)},${mix(240, 68)})`
}

const sampled = computed(() => {
  const n = props.regions.length
  if (n <= GRID_CAP) return props.regions
  const step = n / GRID_CAP
  const out: WeatherRegion[] = []
  for (let i = 0; i < GRID_CAP; i++) out.push(props.regions[Math.floor(i * step)])
  return out
})

const cells = computed(() => {
  const list = sampled.value
  const n = list.length
  if (!n) return []
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  const cw = VIEW_W / cols
  const ch = VIEW_H / rows
  const s = Math.min(cw, ch) * 0.72
  return list.map((r, i) => {
    const air = r.airTemperature ?? null
    const sea = r.seaTemperature ?? null
    const t = air != null && sea != null ? (air + sea) / 2 : air ?? sea ?? 0
    return {
      x: ((i % cols) + 0.5) * cw,
      y: (Math.floor(i / cols) + 0.5) * ch,
      t,
      s,
      name: r.regionName ?? '',
      color: tempColor(t),
    }
  })
})
</script>

<style scoped>
.temperature-layer text {
  user-select: none;
  pointer-events: none;
}
</style>
