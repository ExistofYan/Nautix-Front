<template>
  <g class="weather-layer">
    <!-- 风矢量 -->
    <g v-if="showWind">
      <g v-for="(c, i) in cells" :key="'w' + i" :transform="`translate(${c.x},${c.y})`">
        <line
          x1="0" y1="0"
          :x2="Math.sin((c.windDirection * Math.PI) / 180) * c.len"
          :y2="-Math.cos((c.windDirection * Math.PI) / 180) * c.len"
          :stroke="windColor(c.windSpeed)"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <circle r="1.6" fill="#e2e8f0" fill-opacity="0.7" />
      </g>
    </g>
    <!-- 浪高色块（叠加） -->
    <g v-if="showWave">
      <circle
        v-for="(c, i) in cells"
        :key="'wv' + i"
        :cx="c.x" :cy="c.y"
        :r="4 + c.waveHeight * 5"
        :fill="waveColor(c.waveHeight)"
        fill-opacity="0.22"
      />
    </g>
    <!-- 区域名标签 -->
    <text v-for="(c, i) in cells" :key="'wn' + i" :x="c.x + 8" :y="c.y - 6" font-size="8" fill="#a78bfa" fill-opacity="0.9">
      {{ c.name }}
    </text>
  </g>
</template>

<script setup lang="ts">
/**
 * 天气总览图层：格点散布的风矢量 + 可选浪高晕圈 + 区域名标签。
 * 格点等距抽样（GRID_CAP）：全量区域一次性铺数千节点会让"天气"开关卡顿。
 */
import { computed } from 'vue'
import type { MapBounds } from '@/types/map'
import { VIEW_W, VIEW_H } from '@/types/map'
import type { WeatherRegion } from '@/api/types'

const props = defineProps<{
  bounds: MapBounds
  regions: WeatherRegion[]
  showWind?: boolean
  showWave?: boolean
}>()

/** 格点抽样上限 */
const GRID_CAP = 40

function windColor(v: number): string {
  if (v >= 20) return '#fb7185'
  if (v >= 12) return '#fbbf24'
  if (v >= 6) return '#38bdf8'
  return '#94a3b8'
}

function waveColor(h: number): string {
  if (h >= 4) return '#a78bfa'
  if (h >= 2) return '#22d3ee'
  return '#38bdf8'
}

const cells = computed(() => {
  const src = props.regions
  const n = src.length
  if (!n) return []
  const list: WeatherRegion[] = n <= GRID_CAP ? src : Array.from({ length: GRID_CAP }, (_, i) => src[Math.floor((i * n) / GRID_CAP)])
  const cols = Math.ceil(Math.sqrt(list.length))
  const rows = Math.ceil(list.length / cols)
  return list.map((r, i) => {
    const gx = ((i % cols) + 0.5) * (VIEW_W / cols)
    const gy = (Math.floor(i / cols) + 0.5) * (VIEW_H / rows)
    return {
      x: gx,
      y: gy,
      name: r.regionName ?? `区域${i + 1}`,
      windSpeed: r.windSpeed ?? 0,
      windDirection: r.windDirection ?? 0,
      waveHeight: r.waveHeight ?? 0,
      len: 8 + Math.min(22, (r.windSpeed ?? 0) * 0.9),
    }
  })
})
</script>

<style scoped>
.weather-layer text {
  user-select: none;
  pointer-events: none;
}
</style>
