<template>
  <div class="replay-page nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><VideoCamera /></el-icon> 航迹回放</h1>
      <span class="page-desc">选择航线，重现船舶途经点的完整轨迹</span>
    </div>

    <div class="body">
      <aside class="list-pane nx-panel">
        <div class="list-title">航线列表</div>
        <el-scrollbar height="calc(100vh - 260px)">
          <div
            v-for="r in routes"
            :key="r.id"
            class="route-card"
            :class="{ active: current === r.id }"
            @click="current = r.id"
          >
            <div class="rc-name">{{ r.routeName }}</div>
            <div class="rc-meta">
              <span>{{ r.distanceNm != null ? r.distanceNm.toFixed(0) + ' nm' : '里程未知' }}</span>
            </div>
          </div>
          <el-empty v-if="!loading && routes.length === 0" description="暂无航线" :image-size="60" />
        </el-scrollbar>
      </aside>

      <main class="player-pane">
        <ReplayPlayer :key="current ?? 'none'" :route-id="current ?? undefined" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getRoutePage } from '@/api/route'
import ReplayPlayer from '@/components/replay/ReplayPlayer.vue'

const routes = ref<{ id: number; routeName: string; distanceNm?: number }[]>([])
const current = ref<number | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getRoutePage({ page: 1, count: 50 })
    routes.value = (res.records ?? []).filter(r => r.id != null).map(r => ({ id: r.id as number, routeName: r.routeName ?? `航线 #${r.id}`, distanceNm: r.distanceNm }))
    if (routes.value.length > 0) current.value = routes.value[0].id
  } catch {
    routes.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.replay-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
.page-desc { display: block; margin-top: 6px; color: #64748b; font-size: 13px; }
.body { display: grid; grid-template-columns: 300px 1fr; gap: 18px; min-height: 0; }
.list-pane { border-radius: 14px; padding: 14px; }
.list-title { font-size: 12.5px; font-weight: 700; letter-spacing: 2px; color: #7dd3fc; padding: 4px 8px 12px; }
.route-card {
  border: 1px solid rgba(56,189,248,0.12);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all .18s ease;
}
.route-card:hover { background: rgba(56,189,248,0.07); transform: translateX(2px); }
.route-card.active {
  background: linear-gradient(90deg, rgba(37,99,235,.35), rgba(56,189,248,.12));
  border-color: rgba(125,211,252,.45);
  box-shadow: 0 4px 14px rgba(37,99,235,.28);
}
.rc-name { color: #e2e8f0; font-size: 14px; font-weight: 700; }
.rc-meta { color: #64748b; font-size: 12px; margin-top: 4px; }
.player-pane { min-width: 0; }
@media (max-width: 900px) { .body { grid-template-columns: 1fr; } }
</style>
