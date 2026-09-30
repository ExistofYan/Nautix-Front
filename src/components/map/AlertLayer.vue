<template>
  <g class="alert-layer">
    <g v-for="(a, i) in marks" :key="'al' + i">
      <circle :cx="a.x" :cy="a.y" r="4" fill="none" stroke="#fb7185" stroke-width="1.4" class="pulse" />
      <circle :cx="a.x" :cy="a.y" r="2.6" fill="#fb7185" />
      <text :x="a.x + 7" :y="a.y + 3" font-size="8" fill="#fda4af">{{ a.label }}</text>
    </g>
  </g>
</template>

<script setup lang="ts">
/** 告警图层：待处理告警船位红色脉冲圈 */
import { computed } from 'vue'
import type { MapBounds } from '@/types/map'
import type { AlertRecord, ShipRuntimeStatus } from '@/api/types'
import { makeProjector } from '@/hooks/useMap'

const props = defineProps<{
  bounds: MapBounds
  runtime: ShipRuntimeStatus[]
  /** 未处理告警记录（handleStatus=0）；为空则不渲染 */
  alerts?: AlertRecord[]
}>()

const marks = computed(() => {
  const p = makeProjector(props.bounds)
  const pending = (props.alerts ?? []).filter((a) => a.handleStatus === 0 && a.shipId != null)
  const shipIds = new Set(pending.map((a) => a.shipId as number))
  return props.runtime
    .filter((r) => r.shipId != null && shipIds.has(r.shipId) && r.longitude != null && r.latitude != null)
    .map((r) => {
      const q = p({ longitude: r.longitude as number, latitude: r.latitude as number })
      return { x: q.x, y: q.y, label: `告警 #${r.shipId}` }
    })
})
</script>

<style scoped>
.pulse {
  transform-origin: center;
  transform-box: fill-box;
  animation: alertPulse 1.6s ease-out infinite;
}
@keyframes alertPulse {
  0% { r: 4; opacity: 0.95; }
  70% { r: 14; opacity: 0; }
  100% { r: 14; opacity: 0; }
}
</style>
