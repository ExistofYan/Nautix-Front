<template>
  <g class="port-layer">
    <g
      v-for="p in marks"
      :key="'pm' + p.id"
      :transform="`translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`"
      class="port-hit"
      @click="$emit('select', p.id)"
    >
      <path d="M0,-5.2 L4.6,3.6 L-4.6,3.6 Z" fill="#fbbf24" stroke="#7c5a12" stroke-width="0.5" />
      <text v-if="showLabels" x="7" y="3.5" font-size="8.5" fill="#e2e8f0" fill-opacity="0.85">{{ p.name }}</text>
    </g>
  </g>
</template>

<script setup lang="ts">
/** 港口图层：▲ 标记 + 名称；点击 emit select(portId) */
import { computed } from 'vue'
import type { Port } from '@/api/types'
import { makeProjector } from '@/hooks/useMap'
import type { MapBounds } from '@/types/map'

const props = defineProps<{
  bounds: MapBounds
  ports: Port[]
  showLabels?: boolean
}>()

defineEmits<{ (e: 'select', portId: number): void }>()

const marks = computed(() => {
  const p = makeProjector(props.bounds)
  return props.ports
    .filter((pt) => pt.latitude != null && pt.longitude != null && pt.id != null)
    .slice(0, 120)
    .map((pt) => {
      const q = p({ longitude: pt.longitude as number, latitude: pt.latitude as number })
      return { id: pt.id as number, x: q.x, y: q.y, name: pt.portName ?? pt.portCode ?? `P${pt.id}` }
    })
})
</script>

<style scoped>
.port-hit {
  cursor: pointer;
}
.port-hit:hover path {
  filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.9));
}
</style>
