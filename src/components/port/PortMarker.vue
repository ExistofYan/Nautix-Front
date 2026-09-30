<template>
  <g class="port-marker" @click="$emit('select', port)">
    <polygon
      :points="trianglePoints"
      :fill="active ? '#7dd3fc' : 'rgba(56,189,248,0.85)'"
      stroke="#0b1a30"
      stroke-width="1"
    />
    <text v-if="showLabel" :x="x" :y="y - 10" text-anchor="middle" class="p-label">
      {{ port.portName || `港 #${port.id}` }}
    </text>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Port } from '@/api/types'

const props = withDefaults(defineProps<{
  port: Port
  x: number
  y: number
  size?: number
  showLabel?: boolean
  active?: boolean
}>(), {
  size: 7,
  showLabel: true,
  active: false,
})

defineEmits<{ (e: 'select', port: Port): void }>()

const trianglePoints = computed(() => {
  const s = props.size
  return `${props.x},${props.y - s} ${props.x - s},${props.y + s * 0.7} ${props.x + s},${props.y + s * 0.7}`
})
</script>

<style scoped>
.port-marker { cursor: pointer; }
.port-marker:hover polygon { fill: #bae6fd; }
.p-label { fill: #cbd5e1; font-size: 9px; paint-order: stroke; stroke: rgba(6, 13, 31, 0.8); stroke-width: 2px; }
</style>
