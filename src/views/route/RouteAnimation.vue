<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">航线动画演示</h2>
        <p class="nx-page-desc">船舶图标沿航线路径循环运动</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="ra-wrap" v-loading="store.loading && !store.routes.length">
      <div class="nx-panel ra-ctrl">
        <el-select-v2 v-model="selId" :options="opts" placeholder="选择航线" filterable style="width: 100%" />
        <div class="ctrl-row">
          <el-button round :type="playing ? 'warning' : 'primary'" @click="playing = !playing">
            <el-icon><VideoPause v-if="playing" /><VideoPlay v-else /></el-icon>{{ playing ? '暂停' : '播放' }}
          </el-button>
          <span class="sp-label">单圈 {{ duration.toFixed(0) }}s</span>
          <el-slider v-model="speedPct" :min="10" :max="95" style="flex: 1" />
        </div>
        <RouteCard
          v-if="profile"
          :route="profile.route"
          :point-count="profile.stats.totalPoints"
          :port-name-of="store.portNameOf"
          class="preview-card"
          @select="() => {}"
        />
      </div>

      <RouteAnimation
        v-if="profile"
        :points="profile.points"
        :title="profile.route.routeName || `航线 #${profile.route.id}`"
        :duration="duration"
        :playing="playing"
        class="ra-stage"
      />
      <el-empty v-else description="请选择一条含点位的航线" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Route } from '@/api/types'
import { useRouteStore } from '@/stores/route'
import RouteAnimation from '@/components/route/RouteAnimation.vue'
import RouteCard from '@/components/route/RouteCard.vue'

const store = useRouteStore()
const selId = ref<number>()
const playing = ref(true)
const speedPct = ref(50)

/** 滑杆越大越快：4s ~ 36s */
const duration = computed(() => 36 - (speedPct.value / 100) * 32)

const opts = computed(() =>
  store.routes
    .filter((r: Route) => r.id != null && store.pointsOf(r.id).length > 1)
    .map((r: Route) => ({ value: r.id as number, label: r.routeName || `#${r.id}` }))
)

const profile = computed(() => (selId.value != null ? store.profileById(selId.value) : null))

async function reload() {
  await store.load(true)
  if (!opts.value.some((o: { value: number; label: string }) => o.value === selId.value)) selId.value = opts.value[0]?.value
}

onMounted(async () => {
  await store.load()
  selId.value = opts.value[0]?.value
})
</script>

<style scoped>
.ra-wrap {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  align-items: start;
}
.ra-ctrl {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sp-label {
  font-size: 11.5px;
  color: #7d93b8;
  white-space: nowrap;
}
.preview-card {
  cursor: default;
}
.ra-stage {
  min-height: 420px;
}
@media (max-width: 1100px) {
  .ra-wrap { grid-template-columns: 1fr; }
}
</style>
