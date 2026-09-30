<template>
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" class="route-anim">
    <defs>
      <linearGradient id="raSea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#081326" />
        <stop offset="100%" stop-color="#0a1a33" />
      </linearGradient>
    </defs>
    <rect width="1000" height="600" fill="url(#raSea)" rx="14" />
    <g stroke="rgba(56,189,248,0.07)">
      <line v-for="i in 9" :key="'v' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="600" />
      <line v-for="i in 5" :key="'h' + i" x1="0" :y1="i * 100" x2="1000" :y2="i * 100" />
    </g>

    <!-- 航线路径（含高亮段） -->
    <RoutePolyline
      :points="validPoints"
      :project="project"
      :highlight-ratio="ratio"
    />

    <!-- 沿线运动的船舶图标 -->
    <g v-if="pathD && validPoints.length >= 2">
      <g ref="shipG" class="ra-ship">
        <animateMotion
          ref="motionRef"
          :dur="duration + 's'"
          repeatCount="indefinite"
          rotate="auto"
          :path="pathD"
        />
        <path d="M -9,-6 L 11,0 L -9,6 L -5,0 Z" fill="#7dd3fc" stroke="#0a1428" stroke-width="1" />
      </g>
    </g>

    <text x="20" y="30" class="ra-title">{{ title }}</text>
    <text x="20" y="50" class="ra-sub">{{ validPoints.length }} 个途经点 · {{ fmtNum(totalNm) }} nm</text>
    <el-empty v-if="!validPoints.length" description="该航线暂无点位数据" />
  </svg>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RoutePoint } from '@/api/types'
import RoutePolyline from './RoutePolyline.vue'

const props = withDefaults(
  defineProps<{
    points: RoutePoint[]
    title?: string
    /** 一次循环时长（秒） */
    duration?: number
    playing?: boolean
  }>(),
  { title: '航线动画', duration: 12, playing: true }
)

const motionRef = ref<Element | null>(null)
const shipG = ref<Element | null>(null)

const validPoints = computed(() =>
  [...props.points]
    .filter(p => p.latitude != null && p.longitude != null)
    .sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0))
)

/** 包围盒投影到 1000×600，留边距 */
const bounds = computed(() => {
  const lats = validPoints.value.map(p => p.latitude as number)
  const lons = validPoints.value.map(p => p.longitude as number)
  if (!lats.length) return { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 }
  const pad = 0.08
  const latSpan = Math.max(1e-6, Math.max(...lats) - Math.min(...lats))
  const lonSpan = Math.max(1e-6, Math.max(...lons) - Math.min(...lons))
  return {
    minLat: Math.min(...lats) - latSpan * pad,
    maxLat: Math.max(...lats) + latSpan * pad,
    minLon: Math.min(...lons) - lonSpan * pad,
    maxLon: Math.max(...lons) + lonSpan * pad,
  }
})

function project(lat: number, lon: number) {
  const b = bounds.value
  return {
    x: ((lon - b.minLon) / (b.maxLon - b.minLon)) * 920 + 40,
    y: 560 - ((lat - b.minLat) / (b.maxLat - b.minLat)) * 520,
  }
}

const pathD = computed(() =>
  validPoints.value.length > 1
    ? validPoints.value.map((p, i) => {
        const q = project(p.latitude as number, p.longitude as number)
        return `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`
      }).join(' ')
    : ''
)

/** 用 rAF 估算当前进度比例（与 animateMotion 同周期），驱动高亮段 */
const ratio = ref(0)
let raf = 0
let startAt = 0
function tick(ts: number) {
  if (!startAt) startAt = ts
  const durMs = Math.max(1, props.duration) * 1000
  ratio.value = ((ts - startAt) % durMs) / durMs
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  if (props.playing) raf = requestAnimationFrame(tick)
})

watch(
  () => props.playing,
  p => {
    const el = motionRef.value as unknown as { beginElement?: () => void; endElement?: () => void } | null
    if (p) {
      try { el?.beginElement?.() } catch { /* SMIL 重启动容错 */ }
      if (!raf) raf = requestAnimationFrame(tick)
    } else {
      try { el?.endElement?.() } catch { /* 同上 */ }
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
)

function fmtNum(v?: number | null, d = 1) {
  return v == null || Number.isNaN(v) ? '--' : v.toFixed(d)
}

const totalNm = computed(() => {
  let sum = 0
  for (let i = 1; i < validPoints.value.length; i++) {
    const a = validPoints.value[i - 1]
    const b = validPoints.value[i]
    const R = 3440.065
    const toRad = (x: number) => (x * Math.PI) / 180
    const dLat = toRad((b.latitude as number) - (a.latitude as number))
    const dLon = toRad((b.longitude as number) - (a.longitude as number))
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.latitude as number)) * Math.cos(toRad(b.latitude as number)) * Math.sin(dLon / 2) ** 2
    sum += 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
  }
  return sum
})

void shipG
</script>

<style scoped>
.route-anim {
  width: 100%;
  height: auto;
  display: block;
}
.ra-ship {
  filter: drop-shadow(0 0 6px rgba(125, 211, 252, 0.8));
}
.ra-title {
  fill: #e2e8f0;
  font-size: 16px;
  font-weight: 700;
}
.ra-sub {
  fill: #7d93b8;
  font-size: 11px;
}
</style>
