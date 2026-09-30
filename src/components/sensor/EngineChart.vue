<template>
  <SensorChart title="主机温度趋势（Engine Temp）" :data="points" :unit="unit" height="280px" color="#fb7185">
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
  c => matchKeyword(c, ['engine temp', '温度', 'temp']) && !matchKeyword(c, ['exhaust']),
  () => props.shipId,
)
</script>
