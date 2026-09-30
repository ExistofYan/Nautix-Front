<template>
  <SensorChart title="主机转速趋势（RPM）" :data="points" :unit="unit" height="280px" color="#34d399">
    <template #extra>
      <el-tag size="small" type="info" effect="plain">{{ seriesCount }} 路</el-tag>
    </template>
  </SensorChart>
</template>

<script setup lang="ts">
import SensorChart from '@/components/SensorChart.vue'
import { useSensorSeries, matchKeyword } from './sensorSeries'

const props = defineProps<{ shipId?: number }>()

const { points, unit, seriesCount } = useSensorSeries(
  c => matchKeyword(c, ['rpm', '转速']),
  () => props.shipId,
)
</script>
