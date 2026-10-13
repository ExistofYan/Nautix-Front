<template>
  <div class="nx-page sensor-center">
    <div class="nx-page-header">
      <div>
        <h2 class="nx-page-title">传感器分析中心</h2>
        <p class="nx-page-desc">按船舶浏览传感器配置，查看趋势、统计与波动排行</p>
      </div>
    </div>

    <div class="sc-body">
      <aside class="sc-side">
        <SensorTree @select="onSelect" />
      </aside>
      <main class="sc-main">
        <SensorDetail v-if="selectedId != null" :key="selectedId" :config-id="selectedId" />
        <template v-else>
          <SensorDashboard :ship-id="activeShipId" />
          <div class="sc-list">
            <div class="sc-list-title">传感器清单（点击卡片查看详情）</div>
            <div class="sc-list-grid">
              <SensorCard
                v-for="c in sensorStore.configs.slice(0, 12)"
                :key="c.id"
                :config="c"
                :selected="selectedId === c.id"
                @select="(cfg) => onSelect(cfg)"
              />
            </div>
          </div>
          <div class="sc-charts">
            <EngineChart :ship-id="activeShipId" />
            <FuelChart :ship-id="activeShipId" />
            <RPMChart :ship-id="activeShipId" />
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SensorConfig } from '@/api/types'
import SensorTree from '@/components/sensor/SensorTree.vue'
import SensorDetail from '@/components/sensor/SensorDetail.vue'
import SensorDashboard from '@/components/sensor/SensorDashboard.vue'
import EngineChart from '@/components/sensor/EngineChart.vue'
import FuelChart from '@/components/sensor/FuelChart.vue'
import RPMChart from '@/components/sensor/RPMChart.vue'
import SensorCard from '@/components/sensor/SensorCard.vue'
import { useSensorStore } from '@/stores/sensor'
import { useSensorDataStore } from '@/stores/sensorData'
import { useShipStore } from '@/stores/shipStore'

const selectedId = ref<number>()
const activeShipId = ref<number>()
const sensorStore = useSensorStore()
const dataStore = useSensorDataStore()
const shipStore = useShipStore()
void sensorStore.load()

/**
 * 趋势必须按船取：全站最新读数是跨船轮转写入的，
 * 每一路只有 1~2 个点，画出来就是"0 路 / No sensor data"。
 */
async function ensureTrendFor(shipId?: number) {
  if (shipId == null || activeShipId.value === shipId) return
  activeShipId.value = shipId
  await Promise.all([
    sensorStore.ensureShipConfigs(shipId),
    dataStore.loadTrend(1200, shipId),
  ])
}

async function onSelect(c: SensorConfig) {
  if (c.id == null) return
  await ensureTrendFor(c.shipId)
  selectedId.value = c.id
}

onMounted(async () => {
  await shipStore.loadShips()
  const first = shipStore.ships.find(s => s.id != null)?.id
  if (first != null) await ensureTrendFor(first)
})
</script>

<style scoped>
.sensor-center { display: flex; flex-direction: column; gap: 14px; }
.sc-body { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 14px; align-items: start; }
.sc-side { position: sticky; top: 0; height: calc(100vh - 170px); min-height: 420px; }
.sc-main { min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.sc-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.sc-list { margin-top: 4px; }
.sc-list-title { font-size: 13px; color: var(--nx-text-dim); margin-bottom: 8px; }
.sc-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
@media (max-width: 1100px) {
  .sc-body { grid-template-columns: 1fr; }
  .sc-side { position: static; height: 360px; }
}
</style>
