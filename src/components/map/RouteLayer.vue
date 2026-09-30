<template>
  <g class="route-layer">
    <polyline
      v-for="r in lines"
      :key="'rl' + r.id"
      :points="r.dots"
      fill="none"
      :stroke="r.color"
      :stroke-width="active === r.id ? 2.6 : 1.5"
      :stroke-opacity="dimOthers && active !== null && active !== r.id ? 0.28 : 0.85"
      stroke-linejoin="round"
      stroke-linecap="round"
      stroke-dasharray="7 4"
      class="route-hit"
      @click="$emit('select', r.id)"
    />
    <!-- 端点圆珠 -->
    <circle v-for="(e, i) in endpoints" :key="'re' + i" :cx="e.x" :cy="e.y" r="2.4" :fill="e.color" />
  </g>
</template>

<script setup lang="ts">
/** 多航线折线图层：props routes，颜色 palette 轮转；点击某条 emit select(routeId) */
import { computed } from 'vue'
import type { RoutePoint } from '@/api/types'
import { makeProjector } from '@/hooks/useMap'

export interface RouteLayerItem {
  id: number
  name?: string
  points: RoutePoint[]
}

const props = defineProps<{
  bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }
  routes: RouteLayerItem[]
  active?: number | null
  dimOthers?: boolean
}>()

defineEmits<{ (e: 'select', routeId: number): void }>()

const PALETTE = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#fb7185', '#818cf8']

const proj = computed(() => makeProjector(props.bounds))

const lines = computed(() => {
  const p = proj.value
  return props.routes.map((r, i) => ({
    id: r.id,
    color: PALETTE[i % PALETTE.length],
    dots: r.points
      .filter((pt) => pt.longitude != null && pt.latitude != null)
      .map((pt) => {
        const q = p({ longitude: pt.longitude as number, latitude: pt.latitude as number })
        return `${q.x.toFixed(1)},${q.y.toFixed(1)}`
      })
      .join(' '),
  })).filter((l) => l.dots.split(' ').length > 1)
})

const endpoints = computed(() => {
  const p = proj.value
  const out: { x: number; y: number; color: string }[] = []
  props.routes.forEach((r, i) => {
    const first = r.points[0]
    const last = r.points[r.points.length - 1]
    for (const pt of [first, last]) {
      if (!pt || pt.longitude == null || pt.latitude == null) continue
      const q = p({ longitude: pt.longitude, latitude: pt.latitude })
      out.push({ x: q.x, y: q.y, color: PALETTE[i % PALETTE.length] })
    }
  })
  return out
})
</script>

<style scoped>
.route-hit {
  cursor: pointer;
}
.route-hit:hover {
  stroke-width: 2.6;
}
</style>
