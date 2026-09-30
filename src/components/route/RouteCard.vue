<template>
  <div class="route-card nx-panel" @click="emit('select', route)">
    <div class="rc-head">
      <el-icon class="rc-ic"><Promotion /></el-icon>
      <span class="rc-name">{{ route.routeName || `航线 #${route.id ?? '-'}` }}</span>
    </div>
    <div class="rc-leg">
      <span>{{ portNameOf(route.startPortId) }}</span>
      <span class="rc-arrow">→</span>
      <span>{{ portNameOf(route.endPortId) }}</span>
    </div>
    <div class="rc-foot">
      <span class="rc-dist">{{ fmtNum(route.distanceNm) }} <em>nm</em></span>
      <span class="rc-pts">{{ pointCount }} 个点位</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Route } from '@/api/types'

defineProps<{
  route: Route & { id: number }
  pointCount?: number
  portNameOf: (id?: number | null) => string
}>()

const emit = defineEmits<{
  (e: 'select', route: Route & { id: number }): void
}>()

function fmtNum(v?: number | null, d = 1) {
  return v == null || Number.isNaN(v) ? '--' : v.toFixed(d)
}
</script>

<style scoped>
.route-card {
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(2, 8, 20, 0.55);
}
.rc-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rc-ic {
  color: var(--nx-primary);
}
.rc-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--nx-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rc-leg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--nx-text-dim);
}
.rc-arrow {
  color: var(--nx-violet);
  font-weight: 700;
}
.rc-foot {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.rc-dist {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--nx-primary);
}
.rc-dist em {
  font-style: normal;
  font-size: 11px;
  color: #7d93b8;
}
.rc-pts {
  font-size: 11.5px;
  color: #7d93b8;
}
</style>
