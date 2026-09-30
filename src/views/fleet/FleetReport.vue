<template>
  <div class="fleet-report-page nx-page">
    <div class="page-header nx-panel">
      <h1 class="page-title"><el-icon><Document /></el-icon> 船队报告</h1>
      <el-select-v2 v-model="company" :options="options" filterable placeholder="选择船队" style="width: 280px" />
    </div>
    <FleetReportComp :fleet="fleet" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFleet } from '@/hooks/useFleet'
import FleetReportComp from '@/components/fleet/FleetReport.vue'

const { store } = useFleet()
const company = ref<string | undefined>(undefined)
const options = computed(() => store.fleets.map(f => ({ value: f.company, label: `${f.company}（${f.memberCount} 艘）` })))
const fleet = computed(() => store.fleets.find(f => f.company === company.value) ?? null)
</script>

<style scoped>
.fleet-report-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
</style>
