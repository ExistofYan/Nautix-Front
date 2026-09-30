<template>
  <div class="route-timeline nx-panel">
    <div class="rt-title"><el-icon><MapLocation /></el-icon> 途经点序列</div>
    <el-timeline v-if="sorted.length > 0">
      <el-timeline-item
        v-for="(p, i) in sorted"
        :key="p.id ?? i"
        :timestamp="`WP-${i + 1} · #${p.pointOrder ?? i + 1}`"
        placement="top"
        :type="i === 0 ? 'success' : i === sorted.length - 1 ? 'warning' : 'primary'"
        :hollow="i !== 0 && i !== sorted.length - 1"
      >
        <div class="coord">{{ p.latitude?.toFixed(5) }}°N, {{ p.longitude?.toFixed(5) }}°E</div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无途经点" :image-size="56" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoutePoint } from '@/api/types'

const props = defineProps<{ points: RoutePoint[] }>()

const sorted = computed(() =>
  (props.points ?? [])
    .filter(p => p.latitude != null && p.longitude != null)
    .sort((a, b) => (a.pointOrder ?? 0) - (b.pointOrder ?? 0))
)
</script>

<style scoped>
.route-timeline { border-radius: 14px; padding: 16px 20px; }
.rt-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: #a8bdd9; letter-spacing: 1px; margin-bottom: 14px;
}
.coord { color: #cbd5e1; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 12.5px; }
</style>
