<template>
  <div class="route-compare nx-panel">
    <div class="rcp-title">
      <el-icon><Sort /></el-icon>
      <span>航线对比</span>
      <em>{{ profiles.length }} / {{ maxPick }}</em>
    </div>

    <div class="rcp-pick">
      <el-select-v2
        v-model="picked"
        :options="options"
        multiple
        :multiple-limit="maxPick"
        collapse-tags
        collapse-tags-tooltip
        placeholder="选择 2-3 条航线对比"
        style="width: 100%"
      />
    </div>

    <svg v-if="profiles.length >= 2" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" class="rcp-map">
      <rect width="1000" height="600" fill="#081326" rx="14" />
      <g stroke="rgba(56,189,248,0.07)">
        <line v-for="i in 9" :key="'v' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="600" />
        <line v-for="i in 5" :key="'h' + i" x1="0" :y1="i * 100" x2="1000" :y2="i * 100" />
      </g>
      <RouteLayer :routes="layerItems" :project="project" />
    </svg>

    <div v-if="profiles.length >= 2" class="rcp-bars">
      <div v-for="m in metrics" :key="m.key" class="m-group">
        <div class="m-label">{{ m.label }}</div>
        <div v-for="p in profiles" :key="p.route.id" class="m-row">
          <span class="m-name" :style="{ color: colorOf(p) }">{{ p.route.routeName || `#${p.route.id}` }}</span>
          <div class="m-track">
            <i :style="{ width: pct(p, m) + '%', background: colorOf(p) }"></i>
          </div>
          <span class="m-val">{{ fmt(m.get(p)) }}{{ m.unit }}</span>
        </div>
      </div>
    </div>

    <el-empty v-else description="至少选择 2 条航线开始对比" :image-size="70" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteProfile } from '@/types/route'
import { ROUTE_PALETTE } from '@/stores/route'
import RouteLayer from './RouteLayer.vue'

const props = withDefaults(defineProps<{ profiles: RouteProfile[]; maxPick?: number }>(), { maxPick: 3 })

const picked = ref<number[]>([])

const options = computed(() =>
  props.profiles.map(p => ({ value: p.route.id, label: p.route.routeName || `#${p.route.id}` }))
)

const selected = computed(() => {
  const set = new Set(picked.value)
  return (set.size ? props.profiles.filter(p => set.has(p.route.id)) : props.profiles.slice(0, 2)).slice(0, props.maxPick)
})

const profiles = computed(() => selected.value)

function colorOf(p: RouteProfile) {
  const idx = props.profiles.findIndex(x => x.route.id === p.route.id)
  return ROUTE_PALETTE[(idx < 0 ? 0 : idx) % ROUTE_PALETTE.length]
}

/** 全部选中航线的统一投影 */
const bounds = computed(() => {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity
  for (const p of profiles.value) {
    for (const pt of p.points) {
      if (pt.latitude == null || pt.longitude == null) continue
      minLat = Math.min(minLat, pt.latitude); maxLat = Math.max(maxLat, pt.latitude)
      minLon = Math.min(minLon, pt.longitude); maxLon = Math.max(maxLon, pt.longitude)
    }
  }
  if (!Number.isFinite(minLat)) return { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 }
  const pad = 0.08
  const ls = Math.max(1e-6, maxLat - minLat), os = Math.max(1e-6, maxLon - minLon)
  return { minLat: minLat - ls * pad, maxLat: maxLat + ls * pad, minLon: minLon - os * pad, maxLon: maxLon + os * pad }
})

function project(lat: number, lon: number) {
  const b = bounds.value
  return {
    x: ((lon - b.minLon) / (b.maxLon - b.minLon)) * 920 + 40,
    y: 560 - ((lat - b.minLat) / (b.maxLat - b.minLat)) * 520,
  }
}

const layerItems = computed(() =>
  profiles.value.map(p => ({ route: p.route, points: p.points, color: colorOf(p) }))
)

interface Metric {
  key: string
  label: string
  unit: string
  get: (p: RouteProfile) => number | null
}

const metrics: Metric[] = [
  { key: 'dist', label: '里程', unit: ' nm', get: p => p.stats.declaredDistanceNm ?? p.stats.geoDistanceNm },
  { key: 'pts', label: '途经点数', unit: '', get: p => p.stats.totalPoints },
  { key: 'dur', label: '估算时长', unit: ' h', get: p => p.stats.durationHoursEst },
]

function pct(p: RouteProfile, m: Metric): number {
  const vals = profiles.value.map(x => m.get(x)).filter((v): v is number => v != null && Number.isFinite(v))
  const max = Math.max(...vals, 1e-9)
  const v = m.get(p)
  return v == null ? 0 : Math.max(2, (v / max) * 100)
}

function fmt(v?: number | null, d = 1) {
  return v == null || !Number.isFinite(v) ? '--' : v.toFixed(d)
}
</script>

<style scoped>
.route-compare {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rcp-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
}
.rcp-title em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  color: #7d93b8;
}
.rcp-map {
  width: 100%;
  height: auto;
}
.m-group {
  margin-bottom: 10px;
}
.m-label {
  font-size: 12px;
  color: var(--nx-violet);
  font-weight: 700;
  margin-bottom: 4px;
}
.m-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}
.m-name {
  width: 130px;
  flex: none;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.m-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(56,189,248,0.08);
  overflow: hidden;
}
.m-track i {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.m-val {
  width: 84px;
  flex: none;
  text-align: right;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  color: var(--nx-text-dim);
}
</style>
