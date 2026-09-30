<template>
  <g class="ship-layer">
    <ShipMarkerSvg
      v-for="s in marks"
      :key="'sl' + s.shipId"
      :x="s.x"
      :y="s.y"
      :heading="s.heading"
      :color="s.color"
      class="hit"
      @click.stop="$emit('select', s.shipId)"
      @mouseenter="$emit('hover', s.shipId)"
      @mouseleave="$emit('hover', null)"
    />
  </g>
</template>

<script setup lang="ts">
/** 可点击船点图层：点击 emit select(shipId)，悬停 emit hover(shipId|null) */
import { computed } from 'vue'
import ShipMarkerSvg from './ShipMarker.vue'
import type { MapBounds } from '@/types/map'
import type { ShipRuntimeStatus } from '@/api/types'
import { makeProjector } from '@/hooks/useMap'

const props = defineProps<{
  bounds: MapBounds
  runtime: ShipRuntimeStatus[]
}>()

defineEmits<{
  (e: 'select', shipId: number): void
  (e: 'hover', shipId: number | null): void
}>()

const marks = computed(() => {
  const p = makeProjector(props.bounds)
  return props.runtime
    .filter((r) => r.longitude != null && r.latitude != null && r.shipId != null)
    .map((r) => {
      const q = p({ longitude: r.longitude as number, latitude: r.latitude as number })
      const st = (r.sailingStatus ?? '').toUpperCase()
      const color = /ANCHOR|停/.test(st) ? '#fbbf24' : /BERTH|靠泊/.test(st) ? '#a78bfa' : '#34d399'
      return {
        shipId: r.shipId as number,
        x: q.x,
        y: q.y,
        heading: r.heading ?? 0,
        color,
      }
    })
})
</script>

<style scoped>
.hit {
  cursor: pointer;
}
</style>
