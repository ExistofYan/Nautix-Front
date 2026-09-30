<template>
  <g class="traffic-layer">
    <g v-for="s in marks" :key="'tf' + s.shipId">
      <!-- 航向短线 -->
      <line
        :x1="s.x" :y1="s.y"
        :x2="s.x + Math.sin((s.heading * Math.PI) / 180) * (6 + s.speed)"
        :y2="s.y - Math.cos((s.heading * Math.PI) / 180) * (6 + s.speed)"
        :stroke="speedColor(s.speed)"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-opacity="0.85"
      />
      <circle :cx="s.x" :cy="s.y" r="2.2" fill="#e2e8f0" fill-opacity="0.9" />
      <text :x="s.x + 5" :y="s.y - 4" font-size="7.5" :fill="speedColor(s.speed)">
        {{ s.speed.toFixed(1) }}kn
      </text>
    </g>
  </g>
</template>

<script setup lang="ts">
/** 交通流图层：纯展示速度云（船点+航向矢量+速度标签），不可交互 */
import { computed } from 'vue'
import type { MapBounds } from '@/types/map'
import type { ShipRuntimeStatus } from '@/api/types'
import { makeProjector } from '@/hooks/useMap'

const props = defineProps<{ bounds: MapBounds; runtime: ShipRuntimeStatus[] }>()

function speedColor(v: number): string {
  if (v >= 14) return '#fb7185'
  if (v >= 8) return '#fbbf24'
  if (v >= 2) return '#38bdf8'
  return '#64748b'
}

const marks = computed(() => {
  const p = makeProjector(props.bounds)
  return props.runtime
    .filter((r) => r.longitude != null && r.latitude != null)
    .map((r) => {
      const q = p({ longitude: r.longitude as number, latitude: r.latitude as number })
      return { shipId: r.shipId ?? 0, x: q.x, y: q.y, heading: r.heading ?? 0, speed: r.speed ?? 0 }
    })
})
</script>

<style scoped>
.traffic-layer line {
  stroke-linecap: round;
}
</style>
