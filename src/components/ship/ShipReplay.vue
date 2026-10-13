<template>
  <div class="ship-replay nx-panel">
    <div class="sr-head">
      <span class="sr-title"><el-icon><VideoPlay /></el-icon> 单船轨迹回放</span>
      <el-select-v2 v-model="shipId" :options="shipOptions" filterable clearable placeholder="选择船舶" size="small" style="width: 190px" />
    </div>

    <div class="sr-body">
      <svg class="sr-svg" :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`" preserveAspectRatio="xMidYMid meet">
        <rect :width="VIEW_W" :height="VIEW_H" fill="#081426" rx="10" />
        <g stroke="rgba(56,189,248,0.08)" stroke-width="0.6">
          <line v-for="i in 10" :key="'v' + i" :x1="(i - 1) * (VIEW_W / 10)" y1="0" :x2="(i - 1) * (VIEW_W / 10)" :y2="VIEW_H" />
          <line v-for="i in 6" :key="'h' + i" x1="0" :y1="(i - 1) * (VIEW_H / 6)" :x2="VIEW_W" :y2="(i - 1) * (VIEW_H / 6)" />
        </g>
        <polyline v-if="trailDots.length" :points="trailDots" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-linejoin="round" />
        <circle v-for="(t, i) in trailPts" :key="'tp' + i" :cx="t.x" :cy="t.y" r="2" fill="#7dd3fc" fill-opacity="0.8" />
        <g v-if="headPt" :transform="`translate(${headPt.x},${headPt.y}) rotate(${headHeading})`">
          <path d="M0,-8 C4,-4 4,4 0,8 C-4,4 -4,-4 0,-8 Z" fill="#34d399" stroke="#0a1428" stroke-width="0.8" />
        </g>
        <text v-if="!trailPts.length" :x="VIEW_W / 2" :y="VIEW_H / 2" text-anchor="middle" font-size="12" fill="#64748b">
          {{ shipId == null ? '选择船舶后开始采集轨迹（每 5 秒一个点）' : '采集中，等待轨迹点…' }}
        </text>
      </svg>

      <div class="sr-side">
        <ShipStatus :runtime="currentRuntime" title="当前状态" />
        <div class="sr-stats">
          <div class="st-row"><em>已采点数</em><b>{{ samples.length }}</b></div>
          <div class="st-row"><em>覆盖时长</em><b>{{ Math.round(samples.length * intervalMs / 1000) }}s</b></div>
          <div class="st-row"><em>采样间隔</em><b>{{ (intervalMs / 1000).toFixed(0) }}s</b></div>
        </div>
        <div class="sr-actions">
          <el-button size="small" round @click="samples = []"><el-icon><Delete /></el-icon>清空轨迹</el-button>
          <el-switch v-model="autoFollow" size="small" active-text="自动跟随" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 单船 runtime 轨迹回放：定时采点（/runtime/{shipId}）本地缓存 → SVG polyline。
 * 后端无历史轨迹端点，本组件即"边采边放"的轻量轨迹器；视野随 autoFollow 贴合轨迹包围盒。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ShipInfo, ShipRuntimeStatus } from '@/api/types'
import { getAllShipsCached, getRuntimeByShip } from '@/api/ship'
import { makeProjector, fitBounds } from '@/hooks/useMap'
import { VIEW_W, VIEW_H } from '@/types/map'
import ShipStatus from './ShipStatus.vue'

interface Sample { lon: number; lat: number; heading: number; speed: number; t: number }

const props = withDefaults(defineProps<{ shipId?: number | null; intervalMs?: number }>(), {
  shipId: null,
  intervalMs: 5000,
})

const ships = ref<ShipInfo[]>([])
const shipId = ref<number | null>(props.shipId ?? null)
const samples = ref<Sample[]>([])
const currentRuntime = ref<ShipRuntimeStatus | null>(null)
const autoFollow = ref(true)
let timer: number | undefined

watch(() => props.shipId, (v) => { shipId.value = v })

const shipOptions = computed(() =>
  ships.value.map((s) => ({ value: s.id as number, label: `${s.shipName ?? '船'} #${s.id}` })),
)

const bounds = computed(() =>
  autoFollow.value && samples.value.length >= 2
    ? fitBounds(samples.value.map((s) => ({ longitude: s.lon, latitude: s.lat })))
    : { minLon: -180, maxLon: 180, minLat: -72, maxLat: 84 },
)

const proj = computed(() => makeProjector(bounds.value))

const trailPts = computed(() =>
  samples.value.map((s) => proj.value({ longitude: s.lon, latitude: s.lat })),
)

const trailDots = computed(() =>
  trailPts.value.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
)

const headPt = computed(() =>
  trailPts.value.length ? trailPts.value[trailPts.value.length - 1] : null,
)

const headHeading = computed(() => {
  const n = samples.value.length
  if (!n) return 0
  const last = samples.value[n - 1]
  return last.heading || (n > 1 ? samples.value[n - 2].heading : 0)
})

async function tick() {
  if (shipId.value == null) return
  try {
    const rt = await getRuntimeByShip(shipId.value)
    if (!rt || typeof rt !== 'object') return
    currentRuntime.value = rt
    if (rt.latitude != null && rt.longitude != null) {
      samples.value.push({
        lon: rt.longitude,
        lat: rt.latitude,
        heading: rt.heading ?? 0,
        speed: rt.speed ?? 0,
        t: Date.now(),
      })
      if (samples.value.length > 720) samples.value.splice(0, samples.value.length - 720)
    }
  } catch { /* 静默 */ }
}

watch(shipId, () => { samples.value = []; void tick() })

onMounted(async () => {
  try { ships.value = (await getAllShipsCached()) ?? [] } catch { ships.value = [] }
  if (shipId.value == null && ships.value.length) shipId.value = ships.value[0].id ?? null
  void tick()
  timer = window.setInterval(tick, props.intervalMs)
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.ship-replay { padding: 14px 16px; border-radius: 14px; }
.sr-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.sr-title { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: #e2e8f0; }
.sr-title .el-icon { color: #34d399; }
.sr-body { display: grid; grid-template-columns: 1fr 240px; gap: 14px; }
.sr-svg { width: 100%; height: 100%; min-height: 300px; border-radius: 10px; }
.sr-side { display: flex; flex-direction: column; gap: 12px; }
.sr-stats { background: rgba(13, 31, 49, 0.55); border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 10px; padding: 10px 12px; }
.st-row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 3px 0; }
.st-row em { font-style: normal; color: #64748b; }
.st-row b { color: #cbd5e1; font-variant-numeric: tabular-nums; }
.sr-actions { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 900px) { .sr-body { grid-template-columns: 1fr; } }
</style>
