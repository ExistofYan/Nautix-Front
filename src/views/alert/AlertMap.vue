<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">告警态势图</h2>
        <p class="nx-page-desc">待处理告警的船舶位置分布（records × runtime 经纬度 join）</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="am-grid" v-loading="loading && !points.length">
      <div class="nx-panel am-map">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" class="sea-svg">
          <defs>
            <linearGradient id="seaBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#081326" />
              <stop offset="100%" stop-color="#0a1a33" />
            </linearGradient>
          </defs>
          <rect width="1000" height="600" fill="url(#seaBg)" rx="14" />
          <!-- 经纬网格 -->
          <g stroke="rgba(56,189,248,0.08)" stroke-width="1">
            <line v-for="i in 9" :key="'v' + i" :x1="i * 100" y1="0" :x2="i * 100" y2="600" />
            <line v-for="i in 5" :key="'h' + i" x1="0" :y1="i * 100" x2="1000" :y2="i * 100" />
          </g>
          <!-- 告警点：红色脉冲 -->
          <g v-for="p in points" :key="p.key" class="alert-dot" @mouseenter="hovered = p" @mouseleave="hovered = null" @click="focus(p)">
            <circle :cx="p.x" :cy="p.y" r="16" class="pulse" />
            <circle :cx="p.x" :cy="p.y" r="5" :fill="LEVEL_COLOR[p.levelKey]" stroke="#fff" stroke-width="1.2" />
          </g>
          <!-- tooltip -->
          <g v-if="hovered" :transform="`translate(${Math.min(hovered.x + 14, 760)}, ${Math.max(hovered.y - 44, 8)})`">
            <rect width="230" height="46" rx="8" fill="rgba(10,20,40,0.92)" stroke="rgba(56,189,248,0.35)" />
            <text x="10" y="19" class="tt-ship">{{ hovered.shipName }}</text>
            <text x="10" y="36" class="tt-rule">{{ hovered.ruleName }} · {{ fmtNum(hovered.triggerValue) }}</text>
          </g>
        </svg>
        <div class="am-legend">
          <span><i style="background:#fb7185"></i>紧急</span>
          <span><i style="background:#fbbf24"></i>警告</span>
          <span><i style="background:#38bdf8"></i>提示</span>
        </div>
      </div>

      <div class="nx-panel am-list">
        <div class="al-title">待处理告警（{{ pendingList.length }}）</div>
        <el-scrollbar max-height="520px">
          <AlertCard v-for="a in pendingList" :key="a.id ?? a.alertTime" :alert="a" class="al-card" @select="focusAlert" />
          <el-empty v-if="!pendingList.length && !loading" description="当前没有待处理告警" :image-size="70" />
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAllRuntimeStatus } from '@/api/ship'
import { useAlertStore } from '@/stores/alert'
import AlertCard from '@/components/alert/AlertCard.vue'
import { LEVEL_COLOR, type AlertLevelKey, type EnrichedAlert } from '@/types/alert'
import type { ShipRuntimeStatus } from '@/api/types'

interface MapPoint {
  key: string
  x: number
  y: number
  shipName: string
  ruleName: string
  triggerValue?: number
  levelKey: AlertLevelKey
  lat?: number
  lon?: number
}

const store = useAlertStore()
const loading = ref(false)
const all = ref<EnrichedAlert[]>([])
const runtime = ref<ShipRuntimeStatus[]>([])
const hovered = ref<MapPoint | null>(null)

const pendingList = computed(() =>
  all.value
    .filter(a => a.handleStatus !== 1)
    .sort((a, b) => (b.alertTime || '').localeCompare(a.alertTime || ''))
)

/** records × runtime → 有坐标的告警点 */
const points = computed<MapPoint[]>(() => {
  const rtMap = new Map<number, ShipRuntimeStatus>()
  for (const r of runtime.value) if (r.shipId != null) rtMap.set(r.shipId, r)
  const lats: number[] = []
  const lons: number[] = []
  for (const r of rtMap.values()) {
    if (typeof r.latitude === 'number') lats.push(r.latitude)
    if (typeof r.longitude === 'number') lons.push(r.longitude)
  }
  const minLat = Math.min(...lats, 0)
  const maxLat = Math.max(...lats, 60)
  const minLon = Math.min(...lons, 0)
  const maxLon = Math.max(...lons, 140)
  const sx = (lon: number) => ((lon - minLon) / Math.max(1e-6, maxLon - minLon)) * 920 + 40
  const sy = (lat: number) => 560 - ((lat - minLat) / Math.max(1e-6, maxLat - minLat)) * 520
  const out: MapPoint[] = []
  for (const a of pendingList.value) {
    const rt = a.shipId != null ? rtMap.get(a.shipId) : undefined
    if (!rt || typeof rt.latitude !== 'number' || typeof rt.longitude !== 'number') continue
    out.push({
      key: `${a.id ?? a.alertTime}`,
      x: sx(rt.longitude),
      y: sy(rt.latitude),
      shipName: a.shipName || `#${a.shipId}`,
      ruleName: a.ruleName || `规则#${a.ruleId ?? '-'}`,
      triggerValue: a.triggerValue,
      levelKey: a.levelKey,
      lat: rt.latitude,
      lon: rt.longitude,
    })
  }
  return out
})

function fmtNum(v?: number | string | null) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toFixed(2)
}

async function reload() {
  loading.value = true
  try {
    const [list, rt] = await Promise.all([store.loadAll(), getAllRuntimeStatus().catch(() => [] as ShipRuntimeStatus[])])
    all.value = list
    runtime.value = rt ?? []
  } finally {
    loading.value = false
  }
}

function focus(_p: MapPoint) {
  /* 点击点位聚焦列表项：预留高亮，暂以 hover 为准 */
}

function focusAlert(a: EnrichedAlert) {
  hovered.value = points.value.find(p => p.key === `${a.id ?? a.alertTime}`) ?? null
}

onMounted(reload)
</script>

<style scoped>
.am-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
  align-items: start;
}
.am-map {
  padding: 14px;
}
.sea-svg {
  width: 100%;
  height: auto;
  display: block;
}
.alert-dot {
  cursor: pointer;
}
.pulse {
  fill: rgba(251, 113, 133, 0.28);
  animation: pulse 1.8s ease-out infinite;
  transform-origin: center;
}
@keyframes pulse {
  0% { opacity: 0.9; transform: scale(0.4); }
  70% { opacity: 0; transform: scale(1.6); }
  100% { opacity: 0; transform: scale(1.6); }
}
.tt-ship {
  fill: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
}
.tt-rule {
  fill: #a8bdd9;
  font-size: 11px;
}
.am-legend {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 8px;
  font-size: 12px;
  color: var(--nx-text-dim);
}
.am-legend i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
}
.al-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 14px 16px 10px;
}
.am-list {
  padding-bottom: 12px;
}
.al-card {
  margin: 0 12px 10px;
}
@media (max-width: 980px) {
  .am-grid { grid-template-columns: 1fr; }
}
</style>
