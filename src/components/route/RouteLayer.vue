<template>
  <g class="route-layer">
    <RoutePolyline
      v-for="(item, i) in routes"
      :key="item.route.id ?? i"
      :points="item.points"
      :project="project"
      :color="item.color || ROUTE_PALETTE[i % ROUTE_PALETTE.length]"
      :stroke-width="activeId != null && item.route.id === activeId ? 3 : 1.6"
      :dim-color="activeId != null && item.route.id !== activeId ? 'rgba(56,189,248,0.10)' : undefined"
    />
  </g>
</template>

<script setup lang="ts">
import type { Route, RoutePoint } from '@/api/types'
import RoutePolyline from './RoutePolyline.vue'
import { ROUTE_PALETTE } from '@/stores/route'

defineProps<{
  routes: { route: Route; points: RoutePoint[]; color?: string }[]
  project: (lat: number, lon: number) => { x: number; y: number }
  /** 高亮某条航线（其余变暗） */
  activeId?: number | null
}>()
</script>

<style scoped>
.route-layer {
  pointer-events: none;
}
</style>
