<template>
  <div class="fleet-map nx-panel">
    <svg v-if="dots.length" viewBox="0 0 1000 600" class="sea" preserveAspectRatio="xMidYMid meet">
      <rect width="1000" height="600" fill="#081326" />
      <g stroke="rgba(56,189,248,0.09)" stroke-width="1">
        <line v-for="i in 9" :key="'v' + i" :x1="(1000 / 10) * i" y1="0" :x2="(1000 / 10) * i" y2="600" />
        <line v-for="i in 5" :key="'h' + i" x1="0" :y1="(600 / 6) * i" x2="1000" :y2="(600 / 6) * i" />
      </g>
      <g>
        <circle
          v-for="d in dots"
          :key="d.key"
          :cx="d.x"
          :cy="d.y"
          r="7"
          :fill="d.color"
          fill-opacity="0.85"
          stroke="#e0f2fe"
          stroke-width="1"
        >
          <title>{{ d.name }} · {{ d.status }}</title>
        </circle>
      </g>
    </svg>
    <el-empty v-else description="该船队暂无在线位置数据" :image-size="70" />
    <div v-if="dots.length" class="legend">
      <span><i style="background:#34d399" />航行</span>
      <span><i style="background:#fbbf24" />锚泊/其他</span>
      <span><i style="background:#475569" />离线</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'

const props = defineProps<{ ships: ShipInfo[]; runtimeById: Record<number, ShipRuntimeStatus> }>()

interface Dot { key: string; x: number; y: number; color: string; name: string; status: string }

/** 线性投影（带退化保护），无位置数据的船不画 */
const dots = computed<Dot[]>(() => {
  const pts = props.ships
    .map(s => ({ ship: s, rt: s.id != null ? props.runtimeById[s.id] : undefined }))
    .filter(p => p.rt?.latitude != null && p.rt?.longitude != null) as { ship: ShipInfo; rt: ShipRuntimeStatus & { latitude: number; longitude: number } }[]
  if (pts.length === 0) return []
  let minLon = Math.min(...pts.map(p => p.rt.longitude)), maxLon = Math.max(...pts.map(p => p.rt.longitude))
  let minLat = Math.min(...pts.map(p => p.rt.latitude)), maxLat = Math.max(...pts.map(p => p.rt.latitude))
  if (maxLon - minLon < 1e-6) { minLon -= 0.5; maxLon += 0.5 }
  if (maxLat - minLat < 1e-6) { minLat -= 0.5; maxLat += 0.5 }
  return pts.map((p, i) => {
    const st = p.rt.sailingStatus ?? ''
    const color = /航行|sailing|underway/i.test(st) ? '#34d399' : st ? '#fbbf24' : '#475569'
    return {
      key: `${p.ship.id}-${i}`,
      x: 40 + ((p.rt.longitude - minLon) / (maxLon - minLon)) * 920,
      y: 560 - ((p.rt.latitude - minLat) / (maxLat - minLat)) * 520,
      color,
      name: p.ship.shipName ?? `船 #${p.ship.id}`,
      status: st || '离线',
    }
  })
})
</script>

<style scoped>
.fleet-map { border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.sea { width: 100%; height: auto; display: block; border-radius: 10px; }
.legend { display: flex; gap: 18px; justify-content: center; }
.legend span { display: inline-flex; align-items: center; gap: 6px; color: #64748b; font-size: 12px; }
.legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
</style>
