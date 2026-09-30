<template>
  <g class="pressure-layer">
    <!-- 等压带：按气压排序切成横向渐变条带 -->
    <rect
      v-for="(b, i) in bands"
      :key="'pb' + i"
      x="0"
      :y="b.y"
      :width="VIEW_W"
      :height="b.h"
      :fill="b.color"
      fill-opacity="0.14"
    />
    <!-- 格点数值标签 -->
    <g v-for="(c, i) in cells" :key="'pc' + i">
      <line :x1="c.x - 16" :y1="c.y" :x2="c.x + 16" :y2="c.y" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3 3" />
      <text :x="c.x" :y="c.y - 5" text-anchor="middle" font-size="9" fill="#cbd5e1">{{ c.p.toFixed(0) }}</text>
      <text :x="c.x" :y="c.y + 12" text-anchor="middle" font-size="7.5" fill="#64748b">{{ c.name }}</text>
    </g>
    <text v-if="cells.length === 0" :x="VIEW_W / 2" :y="VIEW_H / 2" text-anchor="middle" font-size="12" fill="#64748b">暂无气压数据</text>
  </g>
</template>

<script setup lang="ts">
/** 等压线简化图层：气压色带 + 数值标签（不过度工程，矩形带即可） */
import { computed } from 'vue'
import type { WeatherRegion } from '@/api/types'
import { VIEW_W, VIEW_H } from '@/types/map'

const props = defineProps<{ regions: WeatherRegion[] }>()

function pColor(p: number): string {
  if (p >= 1020) return '#38bdf8'
  if (p >= 1010) return '#34d399'
  if (p >= 1000) return '#fbbf24'
  return '#fb7185'
}

const withP = computed(() =>
  props.regions.filter((r) => r.pressure != null).sort((a, b) => (b.pressure ?? 0) - (a.pressure ?? 0)),
)

const bands = computed(() => {
  const n = withP.value.length
  if (!n) return []
  const h = VIEW_H / n
  return withP.value.map((r, i) => ({ y: i * h, h, color: pColor(r.pressure ?? 1013) }))
})

const cells = computed(() => {
  const list = withP.value
  const n = list.length
  if (!n) return []
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  return list.map((r, i) => ({
    x: ((i % cols) + 0.5) * (VIEW_W / cols),
    y: (Math.floor(i / cols) + 0.5) * (VIEW_H / rows),
    p: r.pressure as number,
    name: r.regionName ?? '',
  }))
})
</script>

<style scoped>
.pressure-layer text {
  user-select: none;
  pointer-events: none;
}
</style>
