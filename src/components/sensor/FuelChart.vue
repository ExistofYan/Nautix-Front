<template>
  <SensorChart title="燃油消耗趋势（Fuel）" :data="points" :unit="unit" height="280px" color="#fbbf24">
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
  c => matchKeyword(c, ['fuel', '燃油', '油耗']),
  () => props.shipId,
)
</script>
