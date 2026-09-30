<template>
  <div class="nx-page rp-full">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">回放工作台</h2>
        <p class="nx-page-desc">航线选择 + 海图回放 + 播放控制 + 传感器联动，一屏完成</p>
      </div>
      <el-tag effect="dark" round type="info">{{ routeName || '未选航线' }}</el-tag>
    </div>

    <div class="rp-grid">
      <GlassPanel title="航迹回放" class="rp-main">
        <ReplayPlayer :route-id="routeId" />
      </GlassPanel>
      <div class="rp-side">
        <GlassPanel title="当前帧">
          <ReplayPanel
          :frame="store.currentFrame"
          :index="store.currentIndex"
          :total="store.frameCount"
          :speed="store.speed"
          :playing="store.playing"
        />
        </GlassPanel>
        <GlassPanel title="传感器游标">
          <ReplayChart :data="trend" :cursor-index="frameIndex" title="近 60 条读数" />
        </GlassPanel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 整页回放工作台：复用 components/replay 三件套，
 * 数据走 stores/replay（航线点位）+ /sensorData/trend（联动曲线）。
 */
import { computed, onMounted, ref, watch } from 'vue'
import GlassPanel from '@/components/layout/GlassPanel.vue'
import ReplayPlayer from '@/components/replay/ReplayPlayer.vue'
import ReplayPanel from '@/components/replay/ReplayPanel.vue'
import ReplayChart from '@/components/replay/ReplayChart.vue'
import { useReplayStore } from '@/stores/replay'
import { getSensorTrendData } from '@/api/sensor'
import type { SensorData } from '@/api/types'

const store = useReplayStore()
const routeId = ref<number>()
const routeName = ref('')
const trend = ref<SensorData[]>([])

const frameIndex = computed(() => store.currentIndex)

watch(
  () => store.route,
  (r) => { routeName.value = r?.routeName ?? '' },
)

onMounted(async () => {
  try {
    trend.value = await getSensorTrendData(60)
  } catch {
    trend.value = []
  }
})
</script>

<style scoped>
.rp-full { display: flex; flex-direction: column; gap: 14px; }
.rp-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; align-items: start; }
.rp-main { min-width: 0; }
.rp-side { display: flex; flex-direction: column; gap: 14px; }
@media (max-width: 1100px) {
  .rp-grid { grid-template-columns: 1fr; }
}
</style>
