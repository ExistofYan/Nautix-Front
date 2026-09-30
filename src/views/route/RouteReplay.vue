<template>
  <div class="nx-page">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">航线回放</h2>
        <p class="nx-page-desc">左侧选择，右侧沿迹回放；支持多航线叠加对比</p>
      </div>
      <el-button round @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="rrp-grid" v-loading="store.loading && !profiles.length">
      <div class="nx-panel rrp-list">
        <div class="ls-title">航线列表</div>
        <el-scrollbar max-height="600px">
          <RouteCard
            v-for="p in profiles"
            :key="p.route.id"
            :route="p.route"
            :point-count="p.stats.totalPoints"
            :port-name-of="store.portNameOf"
            class="ls-card"
            :class="{ active: selId === p.route.id }"
            @select="selId = p.route.id ?? undefined"
          />
          <el-empty v-if="!profiles.length && !store.loading" description="暂无含点位的航线" :image-size="70" />
        </el-scrollbar>
      </div>

      <div class="rrp-main">
        <RouteReplay :route-id="selId" />
        <RouteComparison v-if="profiles.length >= 2" :profiles="profiles" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouteStore } from '@/stores/route'
import RouteCard from '@/components/route/RouteCard.vue'
import RouteReplay from '@/components/route/RouteReplay.vue'
import RouteComparison from '@/components/route/RouteComparison.vue'
import type { Route } from '@/api/types'
import type { RouteProfile } from '@/types/route'

const store = useRouteStore()
const selId = ref<number>()

const profiles = computed<RouteProfile[]>(() =>
  store.routes
    .filter((r: Route): r is Route & { id: number } => r.id != null && store.pointsOf(r.id).length > 1)
    .map(r => store.profileOf(r))
)

async function reload() {
  await store.load(true)
  if (!profiles.value.some(p => p.route.id === selId.value)) selId.value = profiles.value[0]?.route.id
}

onMounted(async () => {
  await store.load()
  selId.value = profiles.value[0]?.route.id
})
</script>

<style scoped>
.rrp-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
  align-items: start;
}
.ls-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--nx-text);
  padding: 14px 16px 8px;
}
.ls-card {
  margin: 0 12px 10px;
}
.ls-card.active {
  outline: 1px solid rgba(125, 211, 252, 0.55);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.22);
}
.rrp-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
@media (max-width: 1100px) {
  .rrp-grid { grid-template-columns: 1fr; }
}
</style>
