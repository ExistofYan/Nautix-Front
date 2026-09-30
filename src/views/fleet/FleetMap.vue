<template>
  <div class="fleet-map-page nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><MapLocation /></el-icon> 船队态势图</h1>
      <el-select-v2 v-model="company" :options="companyOptions" filterable placeholder="选择船队" style="width: 280px" />
    </div>

    <div v-if="fleet" class="body">
      <FleetMapComp :ships="fleet.ships" :runtime-by-id="fleet.runtimeById" />
      <FleetStatus :ships="fleet.ships" :runtime-by-id="fleet.runtimeById" />
    </div>
    <el-empty v-else description="暂无船队数据（后端未启动或船舶未登记公司）" :image-size="90" />

    <FleetReplay />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFleet } from '@/hooks/useFleet'
import FleetMapComp from '@/components/fleet/FleetMap.vue'
import FleetStatus from '@/components/fleet/FleetStatus.vue'
import FleetReplay from '@/components/fleet/FleetReplay.vue'

const route = useRoute()
const { store } = useFleet()
const company = ref<string | undefined>(undefined)

const companyOptions = computed(() => store.fleets.map(f => ({ value: f.company, label: `${f.company}（${f.memberCount} 艘）` })))
const fleet = computed(() => store.fleets.find(f => f.company === company.value) ?? null)

watch(
  () => [store.fleets.length, route.params.company] as const,
  () => {
    if (company.value && store.fleets.some(f => f.company === company.value)) return
    const fromParam = typeof route.params.company === 'string' ? decodeURIComponent(route.params.company) : ''
    if (store.fleets.some(f => f.company === fromParam)) company.value = fromParam
    else if (store.fleets.length > 0) company.value = store.fleets[0].company
  },
  { immediate: true }
)
</script>

<style scoped>
.fleet-map-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
.body { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr); gap: 18px; align-items: start; }
@media (max-width: 1100px) { .body { grid-template-columns: 1fr; } }
</style>
