<template>
  <span class="sensor-status">
    <el-tag v-if="status === 1" type="success" size="small" effect="dark" round>在线</el-tag>
    <el-tag v-else-if="status === 0" type="info" size="small" effect="dark" round>停用</el-tag>
    <el-tag v-else-if="stale" type="warning" size="small" effect="dark" round>数据延迟</el-tag>
    <el-tag v-else type="info" size="small" effect="plain" round>未知</el-tag>
    <span v-if="lastSeen" class="ss-time">{{ lastSeen }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** SensorConfig.status：1 启用 / 0 停用 */
    status?: number | null
    /** 最近一次读数时间（ISO 字符串） */
    lastRecordedAt?: string | null
  }>(),
  { status: null, lastRecordedAt: null },
)

/** 超过 5 分钟无新读数视为延迟 */
const stale = computed(() => {
  if (!props.lastRecordedAt) return false
  const t = new Date(props.lastRecordedAt).getTime()
  return Number.isFinite(t) && Date.now() - t > 5 * 60 * 1000
})

const lastSeen = computed(() => (props.lastRecordedAt || '').slice(11, 19))
</script>

<style scoped>
.sensor-status { display: inline-flex; align-items: center; gap: 8px; }
.ss-time { font-size: 11px; color: #64748b; font-variant-numeric: tabular-nums; }
</style>
