<template>
  <g class="ocean-layer">
    <defs>
      <linearGradient :id="gid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#08152a" />
        <stop offset="50%" stop-color="#0b1f3d" />
        <stop offset="100%" stop-color="#071223" />
      </linearGradient>
    </defs>
    <rect :width="VIEW_W" :height="VIEW_H" :fill="`url(#${gid})`" />
    <!-- 经纬网格：按当前 bounds 每 ~15° 一条 -->
    <g stroke="rgba(56,189,248,0.09)" stroke-width="0.6">
      <line v-for="(x, i) in gridXs" :key="'gx' + i" :x1="x" y1="0" :x2="x" :y2="VIEW_H" />
      <line v-for="(y, i) in gridYs" :key="'gy' + i" x1="0" :y1="y" :x2="VIEW_W" :y2="y" />
    </g>
    <!-- 赤道/本初子午线加亮 -->
    <line v-if="eqY != null" x1="0" :y1="eqY" :x2="VIEW_W" :y2="eqY" stroke="rgba(56,189,248,0.22)" stroke-dasharray="4 4" />
    <line v-if="pmX != null" :x1="pmX" y1="0" :x2="pmX" :y2="VIEW_H" stroke="rgba(56,189,248,0.22)" stroke-dasharray="4 4" />
  </g>
</template>

<script setup lang="ts">
/** 海洋底图图层：深色渐变 + 经纬网格（无状态，纯 SVG g） */
import { computed } from 'vue'
import type { MapBounds } from '@/types/map'
import { VIEW_W, VIEW_H } from '@/types/map'
import { makeProjector } from '@/hooks/useMap'

const props = defineProps<{ bounds: MapBounds }>()

const gid = `ocean-${Math.random().toString(36).slice(2, 8)}`

const proj = computed(() => makeProjector(props.bounds))

const gridXs = computed(() => {
  const b = props.bounds
  const step = Math.max(1, Math.round((b.maxLon - b.minLon) / 12 / 5) * 5 || 5)
  const out: number[] = []
  for (let lon = Math.ceil(b.minLon / step) * step; lon <= b.maxLon; lon += step) {
    out.push(proj.value({ longitude: lon, latitude: 0 }).x)
  }
  return out
})

const gridYs = computed(() => {
  const b = props.bounds
  const step = Math.max(1, Math.round((b.maxLat - b.minLat) / 8 / 5) * 5 || 5)
  const out: number[] = []
  for (let lat = Math.ceil(b.minLat / step) * step; lat <= b.maxLat; lat += step) {
    out.push(proj.value({ longitude: 0, latitude: lat }).y)
  }
  return out
})

const eqY = computed(() => {
  const b = props.bounds
  if (b.minLat > 0 || b.maxLat < 0) return null
  return proj.value({ longitude: 0, latitude: 0 }).y
})

const pmX = computed(() => {
  const b = props.bounds
  if (b.minLon > 0 || b.maxLon < 0) return null
  return proj.value({ longitude: 0, latitude: 0 }).x
})
</script>

<style scoped>
.ocean-layer text {
  user-select: none;
}
</style>
