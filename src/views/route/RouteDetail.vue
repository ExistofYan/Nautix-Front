<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">航线详情</h2>
        <p class="nx-page-desc">画像、途经点与里程构成</p>
      </div>
      <el-button round @click="$router.back()"><el-icon><Back /></el-icon>返回</el-button>
    </div>

    <div v-loading="store.loading && !profile" class="rd-grid">
      <RoutePanel :profile="profile" />

      <div class="rd-side">
        <div class="nx-panel rd-seg">
          <div class="sg-title">里程构成（相邻段 haversine）</div>
          <div class="sg-bar">
            <i
              v-for="(s, i) in segments"
              :key="i"
              :style="{ width: s.pct + '%', background: segColor(i, segments.length) }"
              :title="`第 ${i + 1} 段 · ${fmt(s.nm)} nm`"
            ></i>
          </div>
          <div class="sg-legend">
            <span>共 {{ segments.length }} 段</span>
            <span>最长段 {{ fmt(maxSegNm) }} nm</span>
            <span>几何合计 {{ fmt(profile?.stats.geoDistanceNm) }} nm</span>
          </div>
        </div>

        <div class="nx-panel rd-table">
          <div class="sg-title">途经点（{{ orderedPoints.length }}）</div>
          <GlassPanel title="途经时间线" class="rd-timeline">
            <RouteTimeline :points="orderedPoints" />
          </GlassPanel>
          <el-table :data="orderedPoints" size="small" max-height="430" stripe>
            <el-table-column prop="pointOrder" label="#" width="56" />
            <el-table-column label="纬度" min-width="110">
              <template #default="{ row }">{{ fmt(row.latitude, 5) }}</template>
            </el-table-column>
            <el-table-column label="经度" min-width="110">
              <template #default="{ row }">{{ fmt(row.longitude, 5) }}</template>
            </el-table-column>
            <el-table-column label="距上一点" width="110">
              <template #default="{ row }">{{ fmt(row.gapNm) }} nm</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!orderedPoints.length && !store.loading" description="该航线暂无线上点位" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import RouteTimeline from '@/components/route/RouteTimeline.vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import request from '@/api/axios'
import { useRouteStore } from '@/stores/route'
import RoutePanel from '@/components/route/RoutePanel.vue'
import type { Route, RouteProfile, RoutePoint } from '@/types/route'

interface GapPoint extends RoutePoint {
  gapNm?: number
}

const route = useRoute()
const store = useRouteStore()

const profile = ref<RouteProfile | null>(null)

/** 容错解析路由参数 id */
function parseId(): number | null {
  const raw = route.params.id ?? route.query.id
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

async function load() {
  const id = parseId()
  if (id == null) {
    profile.value = null
    return
  }
  await store.load()
  await store.ensurePoints(id)
  let p = store.profileById(id)
  if (!p || !p.points.length) {
    // 几何接口也无数据时，退化为单航线详情接口
    try {
      const detail = await request.get<unknown, Route>(`/route/${id}`)
      if (detail && detail.id != null) p = { route: detail as Route & { id: number }, points: [], stats: store.statsOf(detail as Route & { id: number }) }
    } catch { /* 保持空态 */ }
  }
  profile.value = p
}

const orderedPoints = computed<GapPoint[]>(() => {
  const pts = [...(profile.value?.points ?? [])].sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0))
  return pts.map((p, i) => ({ ...p, gapNm: i === 0 ? undefined : store.distanceNm(pts[i - 1], p) }))
})

const segments = computed(() => {
  const gaps = orderedPoints.value.slice(1).map(p => p.gapNm ?? 0)
  const sum = gaps.reduce((a, b) => a + b, 0) || 1
  return gaps.map(g => ({ nm: g, pct: (g / sum) * 100 }))
})

const maxSegNm = computed(() => Math.max(0, ...segments.value.map(s => s.nm)))

function segColor(i: number, n: number) {
  const t = n > 1 ? i / (n - 1) : 0
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${mix(56, 167)},${mix(189, 139)},${mix(248, 250)})`
}

function fmt(v?: number | null, d = 1) {
  return v == null || Number.isNaN(v) ? '--' : v.toFixed(d)
}

onMounted(load)
watch(() => route.fullPath, load)
</script>

<style scoped>
.rd-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 18px;
  align-items: start;
}
.rd-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.sg-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 14px 16px 10px;
}
.sg-bar {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  margin: 0 16px;
  background: rgba(56,189,248,0.08);
}
.sg-bar i {
  height: 100%;
  min-width: 2px;
}
.sg-legend {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: #7d93b8;
  padding: 8px 16px 14px;
}
.rd-table {
  padding-bottom: 12px;
}
@media (max-width: 1100px) {
  .rd-grid { grid-template-columns: 1fr; }
}
</style>
