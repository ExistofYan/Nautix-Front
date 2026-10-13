<template>
  <g class="ship-layer">
    <g
      v-for="s in marks"
      :key="'sl' + s.shipId"
      :transform="`translate(${s.x},${s.y}) rotate(${s.heading})`"
      class="hit"
      @click.stop="$emit('select', s.shipId)"
      @mouseenter="$emit('hover', s.shipId)"
      @mouseleave="$emit('hover', null)"
    >
      <path
        d="M0,-8 C4,-4 4,4 0,8 C-4,4 -4,-4 0,-8 Z"
        :fill="s.color"
        stroke="#0a1428"
        stroke-width="0.8"
      />
      <line x1="0" y1="-8" x2="0" y2="-13" :stroke="s.color" stroke-width="1.2" />
    </g>
  </g>
</template>

<script setup lang="ts">
/**
 * 可点击船点图层：点击 emit select(shipId)，悬停 emit hover(shipId|null)。
 *
 * 性能：直接内联 SVG path，不再为每条船实例化一个子组件；
 * 并限制单次渲染上限（CAP），避免万级节点让主线程长时间冻结。
 */
import { computed } from 'vue'
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

/** 渲染上限：全球视野下密度足够示意，避免万级 DOM 节点 */
const CAP = 800

const marks = computed(() => {
  const p = makeProjector(props.bounds)
  const out: { shipId: number; x: number; y: number; heading: number; color: string }[] = []
  for (const r of props.runtime) {
    if (r.longitude == null || r.latitude == null || r.shipId == null) continue
    const q = p({ longitude: r.longitude, latitude: r.latitude })
    const st = (r.sailingStatus ?? '').toUpperCase()
    const color = /ANCHOR|停/.test(st) ? '#fbbf24' : /BERTH|靠泊/.test(st) ? '#a78bfa' : '#34d399'
    out.push({ shipId: r.shipId, x: q.x, y: q.y, heading: r.heading ?? 0, color })
    if (out.length >= CAP) break
  }
  return out
})
</script>

<style scoped>
.hit {
  cursor: pointer;
}
</style>
