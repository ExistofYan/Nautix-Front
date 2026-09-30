<template>
  <div class="mission-timeline nx-panel">
    <h4><el-icon><Clock /></el-icon> 任务时间线</h4>
    <el-timeline v-if="sorted.length">
      <el-timeline-item
        v-for="m in sorted"
        :key="m.id"
        :timestamp="`${short(m.startAt)} → ${short(m.endAt)}`"
        placement="top"
        :type="phaseOf(m)"
        :hollow="phaseOf(m) === 'info'"
      >
        <div class="mt-name">{{ m.shipName ?? `船 #${m.shipId}` }} · {{ m.routeName ?? `航线 #${m.routeId}` }}</div>
        <div v-if="m.note" class="mt-note">{{ m.note }}</div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无任务计划，先在左侧新建一条" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Mission } from '@/types/fleet'

const props = defineProps<{ missions: Mission[] }>()

const sorted = computed(() => [...props.missions].sort((a, b) => a.startAt.localeCompare(b.startAt)))

function short(iso: string) {
  return (iso ?? '').replace('T', ' ').slice(5, 16)
}

/** 相对当前时间推断阶段：进行中/未开始/已结束 */
function phaseOf(m: Mission) {
  const now = new Date().toISOString().slice(0, 19)
  if (now >= m.startAt && now <= m.endAt) return 'success' as const
  if (now < m.startAt) return 'primary' as const
  return 'info' as const
}
</script>

<style scoped>
.mission-timeline { border-radius: 14px; padding: 18px 20px; }
h4 { margin: 0 0 16px; font-size: 14px; color: #f1f5f9; display: flex; align-items: center; gap: 8px; letter-spacing: .5px; }
.mt-name { color: #e2e8f0; font-size: 13.5px; font-weight: 600; }
.mt-note { color: #64748b; font-size: 12px; margin-top: 4px; }
</style>
