<template>
  <div class="route-panel nx-panel" v-if="profile">
    <div class="rp-head">
      <h3>{{ profile.route.routeName || `航线 #${profile.route.id}` }}</h3>
      <el-tag size="small" effect="dark" round type="info">{{ profile.stats.totalPoints }} 点位</el-tag>
    </div>

    <div class="rp-leg">
      <span class="leg-port"><el-icon><Anchor /></el-icon>{{ portNameOf(profile.route.startPortId) }}</span>
      <span class="leg-arrow">→</span>
      <span class="leg-port"><el-icon><Anchor /></el-icon>{{ portNameOf(profile.route.endPortId) }}</span>
    </div>

    <p v-if="profile.route.description" class="rp-desc">{{ profile.route.description }}</p>

    <svg viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid meet" class="rp-map">
      <rect width="1000" height="420" fill="#081326" rx="12" />
      <g stroke="rgba(56,189,248,0.07)">
        <line v-for="i in 9" :key="'v' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="420" />
        <line v-for="i in 4" :key="'h' + i" x1="0" :y1="i * 84" x2="1000" :y2="i * 84" />
      </g>
      <RoutePolyline :points="profile.points" :project="project" />
    </svg>

    <div class="rp-stats">
      <div class="st"><em>申报里程</em><b>{{ fmt(profile.stats.declaredDistanceNm) }} <i>nm</i></b></div>
      <div class="st"><em>几何里程</em><b>{{ fmt(profile.stats.geoDistanceNm) }} <i>nm</i></b></div>
      <div class="st"><em>平均段距</em><b>{{ fmt(profile.stats.avgSegmentNm) }} <i>nm</i></b></div>
      <div class="st"><em>估算时长</em><b>{{ fmt(profile.stats.durationHoursEst) }} <i>h</i></b></div>
    </div>

    <div class="rp-links">
      <router-link class="rl-btn" :to="`/route/replay/${profile.route.id}`">
        <el-icon><VideoPlay /></el-icon>航迹回放
      </router-link>
      <router-link class="rl-btn" :to="`/route/stats/${profile.route.id}`">
        <el-icon><Histogram /></el-icon>里程分析
      </router-link>
      <slot name="extra" />
    </div>
  </div>
  <el-empty v-else description="未选择航线" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteProfile } from '@/types/route'
import { useRouteStore } from '@/stores/route'
import RoutePolyline from './RoutePolyline.vue'

const props = defineProps<{ profile: RouteProfile | null }>()

const store = useRouteStore()
const portNameOf = store.portNameOf

const bounds = computed(() => {
  const pts = props.profile?.points ?? []
  const lats = pts.map(p => p.latitude).filter((n): n is number => typeof n === 'number')
  const lons = pts.map(p => p.longitude).filter((n): n is number => typeof n === 'number')
  if (!lats.length) return { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 }
  const pad = 0.1
  const ls = Math.max(1e-6, Math.max(...lats) - Math.min(...lats))
  const os = Math.max(1e-6, Math.max(...lons) - Math.min(...lons))
  return { minLat: Math.min(...lats) - ls * pad, maxLat: Math.max(...lats) + ls * pad, minLon: Math.min(...lons) - os * pad, maxLon: Math.max(...lons) + os * pad }
})

function project(lat: number, lon: number) {
  const b = bounds.value
  return {
    x: ((lon - b.minLon) / (b.maxLon - b.minLon)) * 920 + 40,
    y: 380 - ((lat - b.minLat) / (b.maxLat - b.minLat)) * 340,
  }
}

function fmt(v?: number | null, d = 1) {
  return v == null || Number.isNaN(v) ? '--' : v.toFixed(d)
}
</script>

<style scoped>
.route-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rp-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rp-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--nx-text);
}
.rp-leg {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--nx-text-dim);
}
.leg-port {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.leg-arrow {
  color: var(--nx-violet);
  font-weight: 800;
}
.rp-desc {
  margin: 0;
  font-size: 12.5px;
  color: #7d93b8;
  line-height: 1.6;
}
.rp-map {
  width: 100%;
  height: auto;
  border-radius: 12px;
}
.rp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.st {
  background: rgba(56,189,248,0.06);
  border: 1px solid rgba(56,189,248,0.10);
  border-radius: 10px;
  padding: 10px 12px;
  text-align: center;
}
.st em {
  display: block;
  font-style: normal;
  font-size: 11px;
  color: #7d93b8;
  margin-bottom: 3px;
}
.st b {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 15px;
  color: var(--nx-primary);
}
.st i {
  font-style: normal;
  font-size: 10.5px;
  color: #7d93b8;
}
.rp-links {
  display: flex;
  gap: 10px;
}
.rl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(125,211,252,0.35);
  color: #7dd3fc;
  font-size: 13px;
  text-decoration: none;
  transition: all 0.15s ease;
}
.rl-btn:hover {
  background: rgba(56,189,248,0.12);
  box-shadow: 0 0 14px rgba(56,189,248,0.25);
}
</style>
