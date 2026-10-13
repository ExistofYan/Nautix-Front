<template>
  <div class="route-replay nx-panel">
    <div class="rr-bar">
      <el-select-v2 v-model="selId" :options="opts" placeholder="选择航线" filterable style="width: 260px" />
      <el-button round :type="playing ? 'warning' : 'primary'" @click="playing = !playing">
        <el-icon><VideoPause v-if="playing" /><VideoPlay v-else /></el-icon>{{ playing ? '暂停' : '播放' }}
      </el-button>
      <span class="rr-speed">速度</span>
      <el-slider v-model="speed" :min="4" :max="40" :step="2" style="width: 140px" />
      <span class="rr-dur">{{ duration.toFixed(0) }}s/圈</span>
    </div>

    <RouteAnimation v-if="profile" :points="profile.points" :title="profile.route.routeName || `航线 #${profile.route.id}`" :duration="duration" :playing="playing" />
    <el-empty v-else description="请选择一条含点位的航线" :image-size="80" />

    <div v-if="profile" class="rr-stats">
      <span>里程 {{ fmt(profile.stats.declaredDistanceNm ?? profile.stats.geoDistanceNm) }} nm</span>
      <span>点位 {{ profile.stats.totalPoints }}</span>
      <span>估算时长 {{ fmt(profile.stats.durationHoursEst) }} h（参考航速 {{ fmt(profile.stats.refSpeedKn, 1) }} kn）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Route } from '@/api/types'
import { useRouteStore } from '@/stores/route'
import RouteAnimation from './RouteAnimation.vue'

const props = defineProps<{ routeId?: number }>()

const store = useRouteStore()
const selId = ref<number | undefined>(props.routeId)
const playing = ref(true)
const speed = ref(12)

const duration = computed(() => Math.max(4, 44 - speed.value))

const opts = computed(() =>
  store.routes
    .filter((r: Route) => r.id != null && store.pointsOf(r.id).length > 1)
    .map((r: Route) => ({ value: r.id as number, label: r.routeName || `#${r.id}` }))
)

const profile = computed(() => (selId.value != null ? store.profileById(selId.value) : null))

/** 选中航线后按需补齐完整点位（总览只有抽稀几何） */
watch(selId, (v) => { if (v != null) void store.ensurePoints(v) }, { immediate: true })

onMounted(async () => {
  await store.load()
  if (selId.value == null) selId.value = opts.value[0]?.value
})

function fmt(v?: number | null, d = 1) {
  return v == null || Number.isNaN(v) ? '--' : v.toFixed(d)
}
</script>

<style scoped>
.route-replay {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rr-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.rr-speed {
  font-size: 12px;
  color: #7d93b8;
}
.rr-dur {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  color: var(--nx-primary);
}
.rr-stats {
  display: flex;
  gap: 22px;
  font-size: 12.5px;
  color: var(--nx-text-dim);
  border-top: 1px solid rgba(56,189,248,0.10);
  padding-top: 10px;
}
</style>
