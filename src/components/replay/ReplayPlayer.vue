<template>
  <div class="replay-player">
    <div v-if="!props.routeId" class="picker nx-panel">
      <span class="picker-label"><el-icon><Guide /></el-icon> 选择航线</span>
      <el-select-v2
        v-model="picked"
        :options="routeOptions"
        placeholder="请选择要回放的航线"
        filterable
        clearable
        style="width: 300px"
      />
    </div>

    <template v-if="activeId != null || props.routeId != null">
      <div class="head">
        <div class="title-wrap">
          <span class="title">{{ store.route?.routeName ?? '航迹回放' }}</span>
          <el-tag v-if="store.frameCount" size="small" effect="dark" round type="info">
            {{ store.frameCount }} 个途经点
          </el-tag>
        </div>
        <PlaybackControl
          :playing="store.playing"
          :speed="store.speed"
          :loop="store.loop"
          @toggle="store.toggle()"
          @prev="store.prev()"
          @next="store.next()"
          @speed="store.setSpeed($event)"
          @loop="store.setLoop($event)"
        />
      </div>

      <el-skeleton v-if="store.loading" animated>
        <template #template><el-skeleton-item variant="rect" style="width:100%;height:360px;border-radius:14px" /></template>
      </el-skeleton>

      <ReplayMap v-else-if="store.frames.length > 1" :frames="store.frames" :index="store.currentIndex" />
      <el-empty v-else description="该航线暂无可用点位" :image-size="80" />

      <div v-if="store.frames.length > 1" class="timeline-row nx-panel">
        <TimelineSlider
          :model-value="store.currentIndex"
          :max="store.lastIndex"
          @update:model-value="store.seek($event)"
        />
      </div>

      <div class="side-row">
        <ReplayPanel
          :frame="store.currentFrame"
          :index="store.currentIndex"
          :total="store.frameCount"
          :speed="store.speed"
          :playing="store.playing"
        />
      </div>
    </template>

    <el-empty v-else description="请先选择一条航线开始回放" :image-size="90" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getRoutePage } from '@/api/route'
import { useReplayStore } from '@/stores/replay'
import { useReplay } from '@/hooks/useReplay'
import ReplayMap from './ReplayMap.vue'
import TimelineSlider from './TimelineSlider.vue'
import PlaybackControl from './PlaybackControl.vue'
import ReplayPanel from './ReplayPanel.vue'

const props = defineProps<{ routeId?: number }>()
const store = useReplayStore()

const picked = ref<number | undefined>(undefined)
const routes = ref<{ id: number; routeName: string }[]>([])

/** 内置选择器选中值；外部传入 routeId 时忽略 */
const activeId = computed(() => (props.routeId == null ? picked.value : undefined))

useReplay(() => activeId.value ?? props.routeId)

const routeOptions = computed(() =>
  routes.value.map(r => ({ value: r.id, label: r.routeName }))
)

onMounted(async () => {
  try {
    const res = await getRoutePage({ page: 1, count: 50 })
    routes.value = (res.records ?? []).filter(r => r.id != null).map(r => ({ id: r.id as number, routeName: r.routeName ?? `航线 #${r.id}` }))
    if (routes.value.length === 1 && picked.value == null && props.routeId == null) picked.value = routes.value[0].id
  } catch {
    routes.value = []
  }
})
</script>

<style scoped>
.replay-player {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.picker {
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 14px;
  padding: 14px 18px;
}
.picker-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a8bdd9;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  font-size: 18px;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: 0.5px;
}
.timeline-row {
  border-radius: 14px;
  padding: 16px 22px;
}
.side-row {
  display: grid;
  grid-template-columns: minmax(260px, 380px);
}
</style>
