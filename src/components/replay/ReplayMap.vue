<template>
  <div class="replay-map nx-panel">
    <svg v-if="frames.length > 0" :viewBox="`0 0 ${W} ${H}`" class="sea" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="rm-route" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#a78bfa" />
        </linearGradient>
        <radialGradient id="rm-sea" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stop-color="#0c1c36" />
          <stop offset="100%" stop-color="#060d1f" />
        </radialGradient>
      </defs>

      <rect :width="W" :height="H" fill="url(#rm-sea)" />

      <!-- 经纬网格 -->
      <g stroke="rgba(56,189,248,0.10)" stroke-width="1">
        <line v-for="i in 9" :key="'v' + i" :x1="(W / 10) * i" y1="0" :x2="(W / 10) * i" :y2="H" />
        <line v-for="i in 5" :key="'h' + i" x1="0" :y1="(H / 6) * i" :x2="W" :y2="(H / 6) * i" />
      </g>

      <!-- 未走过段（暗淡） -->
      <polyline :points="futurePoints" fill="none" stroke="rgba(148,184,232,0.28)" stroke-width="2" stroke-dasharray="5 6" />
      <!-- 完整航线轮廓 -->
      <polyline :points="allPoints" fill="none" stroke="url(#rm-route)" stroke-width="1.4" opacity="0.35" />
      <!-- 已走过高亮段 -->
      <polyline :points="traveledPoints" fill="none" stroke="url(#rm-route)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

      <!-- 途经点 -->
      <g v-for="(p, i) in projected" :key="'pt' + i">
        <circle :cx="p.x" :cy="p.y" :r="i === index ? 0 : 3.2" :fill="i <= index ? '#7dd3fc' : 'rgba(148,184,232,0.4)'" />
      </g>

      <!-- 起终点标签 -->
      <text v-if="projected.length" :x="projected[0].x + 8" :y="projected[0].y - 8" class="port-label">起点</text>
      <text v-if="projected.length" :x="projected[projected.length - 1].x + 8" :y="projected[projected.length - 1].y - 8" class="port-label">终点</text>

      <!-- 当前船位 + 航向箭头 -->
      <g v-if="ship" :transform="`translate(${ship.x},${ship.y})`">
        <circle r="10" fill="rgba(56,189,248,0.18)" />
        <circle r="4.5" fill="#38bdf8" stroke="#e0f2fe" stroke-width="1.5" />
        <g :transform="`rotate(${heading})`">
          <path d="M 8 0 L 18 -4.5 L 15 0 L 18 4.5 Z" fill="#a78bfa" />
        </g>
      </g>
    </svg>
    <el-empty v-else description="暂无航线点位数据" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReplayFrame } from '@/types/replay'

const props = withDefaults(defineProps<{ frames: ReplayFrame[]; index?: number }>(), { index: 0 })

const W = 1000
const H = 600
const PAD = 60

/** 线性投影：lon→x，lat→y（纬度取反使北在上），带边界与退化保护 */
const bounds = computed(() => {
  const lons = props.frames.map(f => f.longitude)
  const lats = props.frames.map(f => f.latitude)
  let minLon = Math.min(...lons), maxLon = Math.max(...lons)
  let minLat = Math.min(...lats), maxLat = Math.max(...lats)
  if (maxLon - minLon < 1e-6) { minLon -= 0.5; maxLon += 0.5 }
  if (maxLat - minLat < 1e-6) { minLat -= 0.5; maxLat += 0.5 }
  return { minLon, maxLon, minLat, maxLat }
})

function project(f: ReplayFrame) {
  const { minLon, maxLon, minLat, maxLat } = bounds.value
  const x = PAD + ((f.longitude - minLon) / (maxLon - minLon)) * (W - PAD * 2)
  const y = H - PAD - ((f.latitude - minLat) / (maxLat - minLat)) * (H - PAD * 2)
  return { x, y }
}

const projected = computed(() => props.frames.map(project))
const ptsStr = (arr: { x: number; y: number }[]) => arr.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

const allPoints = computed(() => ptsStr(projected.value))
const traveledPoints = computed(() => ptsStr(projected.value.slice(0, props.index + 1)))
const futurePoints = computed(() => ptsStr(projected.value.slice(props.index)))

const ship = computed(() => projected.value[props.index] ?? null)

const heading = computed(() => {
  const fs = props.frames
  const i = props.index
  const a = fs[Math.max(i - 1, 0)]
  const b = fs[Math.min(i + 1, fs.length - 1)]
  if (!a || !b || (a === b && i === 0 && fs.length < 2)) return 0
  const dx = b.longitude - a.longitude
  const dy = -(b.latitude - a.latitude)
  return (Math.atan2(dy, dx) * 180) / Math.PI
})
</script>

<style scoped>
.replay-map {
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}
.sea {
  width: 100%;
  height: auto;
  display: block;
}
.port-label {
  fill: #94a3b8;
  font-size: 14px;
  letter-spacing: 1px;
}
</style>
